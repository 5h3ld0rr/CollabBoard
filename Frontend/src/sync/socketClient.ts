import { io, Socket } from 'socket.io-client';
import type { Task, Board, RealtimeTaskPayload, RealtimeTaskDeletedPayload } from '../types';

export type TaskSocketEventPayload<T = Task> = RealtimeTaskPayload<T>;
export type TaskDeletedSocketPayload = RealtimeTaskDeletedPayload;

export interface BoardUpdatedSocketPayload {
  board: Board;
  boardId: string;
  actorId: string;
  columns?: any[];
  title?: string;
  timestamp?: string;
}

let socketInstance: Socket | null = null;
let currentJoinedBoard: string | null = null;

function getSocketServerUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__SOCKET_URL__) {
    return (window as any).__SOCKET_URL__;
  }
  if (import.meta.env && (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL)) {
    return (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL);
  }
  if ((globalThis as any).process?.env?.VITE_SOCKET_URL) {
    return (globalThis as any).process.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return 'http://localhost:4000';
}

const SOCKET_SERVER_URL = getSocketServerUrl();

export interface SocketClientOptions {
  token?: string | null;
  url?: string;
  autoConnect?: boolean;
}

/**
 * Checks if the singleton socket instance is currently connected
 */
export function isSocketConnected(): boolean {
  return Boolean(socketInstance && socketInstance.connected);
}

/**
 * Returns the active board room identifier currently tracked by the client
 */
export function getActiveJoinedBoard(): string | null {
  return currentJoinedBoard;
}

/**
 * Initializes or returns the singleton Socket.io client
 */
export function getSocketClient(tokenOrOptions?: string | null | SocketClientOptions): Socket {
  const options: SocketClientOptions =
    typeof tokenOrOptions === 'string'
      ? { token: tokenOrOptions }
      : (tokenOrOptions ?? {});

  let rawToken = options.token;
  if (!rawToken || rawToken === 'cookie-session') {
    try {
      rawToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    } catch {
      // Ignore storage errors
    }
  }
  const token = rawToken && rawToken !== 'cookie-session' ? rawToken : null;
  const serverUrl = options.url || SOCKET_SERVER_URL;

  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(serverUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: options.autoConnect ?? true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    auth: token ? { token } : undefined,
  });

  socketInstance.on('connect', () => {
    // If we had a previously active board before reconnect, re-join the room (Slide 18)
    if (currentJoinedBoard && socketInstance) {
      socketInstance.emit('board:join', currentJoinedBoard);
    }
  });

  // Slide 11 & 12: Handle token errors during handshake and trigger auth expiration/logout
  socketInstance.on('connect_error', (err: any) => {
    const errorMsg = err?.message || '';
    if (errorMsg === 'BAD_TOKEN' || errorMsg === 'NO_TOKEN') {
      triggerAuthError(errorMsg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired', { detail: { reason: errorMsg } }));
      }
    }
  });

  return socketInstance;
}

export type AuthErrorListener = (reason: string) => void;
const authErrorListeners = new Set<AuthErrorListener>();

/**
 * Registers an observer for socket authentication errors (BAD_TOKEN / NO_TOKEN)
 */
export function onSocketAuthError(listener: AuthErrorListener): () => void {
  authErrorListeners.add(listener);
  return () => {
    authErrorListeners.delete(listener);
  };
}

function triggerAuthError(reason: string): void {
  authErrorListeners.forEach((listener) => {
    try {
      listener(reason);
    } catch (e) {
      console.error('[SocketClient] Auth error listener failed:', e);
    }
  });
}

/**
 * Disconnects and tears down the active socket instance
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    currentJoinedBoard = null;
  }
}

/**
 * Joins a specific board room for real-time board & task sync (Slide 16)
 */
export function joinBoardRoom(boardId: string): void {
  currentJoinedBoard = boardId;
  const socket = socketInstance || getSocketClient();
  if (socket) {
    socket.emit('board:join', boardId);
  }
}

export const emitBoardJoin = joinBoardRoom;

/**
 * Leaves a specific board room
 */
export function leaveBoardRoom(boardId: string): void {
  if (currentJoinedBoard === boardId) {
    currentJoinedBoard = null;
  }
  const socket = socketInstance || getSocketClient();
  if (socket) {
    socket.emit('board:leave', boardId);
  }
}

export const emitBoardLeave = leaveBoardRoom;

/**
 * Subscribes to connect and disconnect lifecycle events with automatic reconnection restart
 * and clean teardown (Session 5 - Slide 18)
 */
export function subscribeSocketConnection(
  onConnect: () => void,
  onDisconnect?: (reason: string) => void
): () => void {
  const socket = socketInstance || getSocketClient();

  const handleConnect = () => {
    onConnect();
  };

  const handleDisconnect = (reason: string) => {
    if (onDisconnect) {
      onDisconnect(reason);
    }
    // Slide 18: If the server disconnected the socket forcefully, trigger manual restart
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  };

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);

  return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
  };
}

/**
 * Subscribes to real-time task:created events
 */
export function subscribeTaskCreated(
  callback: (payload: TaskSocketEventPayload) => void
): () => void {
  const socket = socketInstance || getSocketClient();
  socket.on('task:created', callback);
  return () => {
    socket.off('task:created', callback);
  };
}

/**
 * Subscribes to real-time task:updated events
 */
export function subscribeTaskUpdated(
  callback: (payload: TaskSocketEventPayload) => void
): () => void {
  const socket = socketInstance || getSocketClient();
  socket.on('task:updated', callback);
  return () => {
    socket.off('task:updated', callback);
  };
}

/**
 * Subscribes to real-time task:deleted events
 */
export function subscribeTaskDeleted(
  callback: (payload: TaskDeletedSocketPayload) => void
): () => void {
  const socket = socketInstance || getSocketClient();
  socket.on('task:deleted', callback);
  return () => {
    socket.off('task:deleted', callback);
  };
}

/**
 * Subscribes to real-time board:updated events (Slide 15)
 */
export function subscribeBoardUpdated(
  callback: (payload: BoardUpdatedSocketPayload) => void
): () => void {
  const socket = socketInstance || getSocketClient();
  socket.on('board:updated', callback);
  return () => {
    socket.off('board:updated', callback);
  };
}

/**
 * Subscribes to real-time presence:update events (Slide 19)
 */
export function subscribePresenceUpdate(
  callback: (onlineUserIds: string[]) => void
): () => void {
  const socket = socketInstance || getSocketClient();
  socket.on('presence:update', callback);
  return () => {
    socket.off('presence:update', callback);
  };
}

/**
 * Subscribes to real-time direct personal notifications (notification:direct)
 * Broadcast to a specific user across all their active sessions
 */
export function subscribeDirectNotification(
  callback: (payload: any) => void
): () => void {
  const socket = socketInstance || getSocketClient();
  socket.on('notification:direct', callback);
  return () => {
    socket.off('notification:direct', callback);
  };
}

