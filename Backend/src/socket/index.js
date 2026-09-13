import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

let io = null;

/**
 * Socket.io authentication middleware
 * Validates JWT token passed in handshake auth, query, or headers.
 */
export function socketAuthMiddleware(socket, next) {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;

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

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const payload = jwt.verify(token, config.jwtSecret);
    socket.user = {
      id: payload.sub,
      email: payload.email,
    };
    next();
  } catch (err) {
    next(new Error(`Authentication error: ${err.message}`));
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

    // Handle joining a board room for real-time task updates
    socket.on('join:board', (boardId) => {
      if (boardId) {
        const roomName = `board:${boardId}`;
        socket.join(roomName);
        socket.emit('joined:board', { boardId, room: roomName });
      }
    });

    // Handle leaving a board room
    socket.on('leave:board', (boardId) => {
      if (boardId) {
        const roomName = `board:${boardId}`;
        socket.leave(roomName);
        socket.emit('left:board', { boardId, room: roomName });
      }
    });

    socket.on('disconnect', (reason) => {
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
 * Closes the Socket.io server instance (useful for clean teardown and test suites)
 */
export async function closeSocket() {
  if (io) {
    await new Promise((resolve) => io.close(resolve));
    io = null;
  }
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
