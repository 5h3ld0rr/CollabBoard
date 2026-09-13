import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { presenceTracker } from './presenceTracker.js';

let io = null;

/**
 * Announces active presence (connected user IDs) to everyone in a board room
 * @param {string} boardId
 */
export function announcePresence(boardId) {
  if (!io || !boardId) return;
  const onlineUsers = presenceTracker.getOnlineUserIds(boardId);
  io.to(`board:${boardId}`).emit('presence:update', onlineUsers);
}

/**
 * Socket.io authentication middleware
 * Validates JWT token passed in handshake auth, query, or headers.
 */
export function socketAuthMiddleware(socket, next) {
  try {
    // Slide 11: Prefer auth payload to avoid query string leakage in server/proxy logs
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token;
      // Sanitize query parameter to prevent token exposure in access logs
      delete socket.handshake.query.token;
    }

    if (!token && socket.handshake.headers?.authorization) {
      const parts = socket.handshake.headers.authorization.split(' ');
      if (parts[0] === 'Bearer' && parts[1]) {
        token = parts[1];
      }
    }

    if (!token && socket.handshake.headers?.cookie) {
      const match = socket.handshake.headers.cookie.match(/token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    // Session 5 - Slide 11: Return strict 'NO_TOKEN' error code
    if (!token) {
      return next(new Error('NO_TOKEN'));
    }

    // Session 5 - Slide 11: Validate JWT, return strict 'BAD_TOKEN' on failure
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      socket.user = {
        id: payload.sub,
        email: payload.email,
      };
      next();
    } catch {
      return next(new Error('BAD_TOKEN'));
    }
  } catch (err) {
    next(new Error('BAD_TOKEN'));
  }
}

/**
 * Initializes the Socket.io server instance attached to the HTTP server
 * @param {import('http').Server} httpServer
 * @param {object} [options]
 * @returns {Server}
 */
export function initSocket(httpServer, options = {}) {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 20000,
    pingInterval: 25000,
    ...options,
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Handle board room join (supports both 'board:join' and 'join:board')
    const handleJoinBoard = (boardId) => {
      if (!boardId || typeof boardId !== 'string' || !boardId.trim()) return;
      const bId = String(boardId).trim();
      const roomName = `board:${bId}`;
      socket.join(roomName);

      // Track presence
      if (userId) {
        presenceTracker.addConnection(bId, userId);
        announcePresence(bId);
      }

      socket.emit('joined:board', { boardId: bId, room: roomName });
    };

    // Handle board room leave (supports both 'board:leave' and 'leave:board')
    const handleLeaveBoard = (boardId) => {
      if (!boardId) return;
      const bId = String(boardId).trim();
      const roomName = `board:${bId}`;
      socket.leave(roomName);

      // Remove from presence
      if (userId) {
        presenceTracker.removeConnection(bId, userId);
        announcePresence(bId);
      }

      socket.emit('left:board', { boardId: bId, room: roomName });
    };

    socket.on('board:join', handleJoinBoard);
    socket.on('join:board', handleJoinBoard);
    socket.on('board:leave', handleLeaveBoard);
    socket.on('leave:board', handleLeaveBoard);

    // Clean up presence on socket disconnecting
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('board:')) {
          const bId = room.slice('board:'.length);
          if (userId) {
            presenceTracker.removeConnection(bId, userId);
            announcePresence(bId);
          }
        }
      }
    });

    socket.on('disconnect', (_reason) => {
      // Clean disconnect
    });
  });

  return io;
}

/**
 * Returns the current Socket.io server instance
 * @returns {Server|null}
 */
export function getIO() {
  return io;
}

/**
 * Closes the Socket.io server instance and clears presence (for tests & shutdown)
 */
export async function closeSocket() {
  if (io) {
    await new Promise((resolve) => io.close(resolve));
    io = null;
  }
  presence.clear();
}

/**
 * Broadcasts an event to all clients in a specific board room
 * @param {string} boardId
 * @param {string} event
 * @param {object} payload
 */
export function emitToBoard(boardId, event, payload) {
  if (!io || !boardId) return;
  io.to(`board:${boardId}`).emit(event, payload);
}

/**
 * Emits board:updated event to board subscribers (Slide 15)
 * @param {string} boardId
 * @param {object} board
 * @param {string} actorId
 */
export function emitBoardUpdated(boardId, board, actorId) {
  emitToBoard(boardId, 'board:updated', {
    board,
    boardId: String(boardId),
    actorId: String(actorId),
    columns: board.columns || [],
    title: board.title,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emits task:created event to board subscribers
 * @param {string} boardId
 * @param {object} task
 * @param {string} actorId
 */
export function emitTaskCreated(boardId, task, actorId) {
  emitToBoard(boardId, 'task:created', {
    task,
    boardId: String(boardId),
    actorId: String(actorId),
    version: task.version ?? 1,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emits task:updated event to board subscribers
 * @param {string} boardId
 * @param {object} task
 * @param {string} actorId
 */
export function emitTaskUpdated(boardId, task, actorId) {
  emitToBoard(boardId, 'task:updated', {
    task,
    boardId: String(boardId),
    actorId: String(actorId),
    version: task.version,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emits task:deleted event to board subscribers
 * @param {string} boardId
 * @param {string} taskId
 * @param {string} actorId
 * @param {number} [version]
 */
export function emitTaskDeleted(boardId, taskId, actorId, version = 1) {
  emitToBoard(boardId, 'task:deleted', {
    taskId: String(taskId),
    boardId: String(boardId),
    actorId: String(actorId),
    version: Number(version),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Retrieves presence diagnostic statistics for a given board or entire server
 * (Aligns with Session 2 health checks and monitoring)
 * @param {string} [boardId]
 */
export function getPresenceStats(boardId) {
  if (boardId) {
    return presenceTracker.getBoardStats(boardId);
  }
  return {
    totalTrackedBoards: presenceTracker.presence.size,
    totalOnlineUsers: Array.from(presenceTracker.presence.values()).reduce(
      (sum, map) => sum + map.size,
      0
    ),
  };
}
