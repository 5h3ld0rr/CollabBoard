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

const SOCKET_SERVER_URL =
  (typeof process !== 'undefined' && process.env?.VITE_SOCKET_URL) ||
  (typeof window !== 'undefined' && (window as any).__SOCKET_URL__) ||
  'http://localhost:4000';

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

  const token = options.token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
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

  return socketInstance;
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
