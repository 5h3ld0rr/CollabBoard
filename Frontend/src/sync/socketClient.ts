import { io, Socket } from 'socket.io-client';
import type { Task, RealtimeTaskPayload, RealtimeTaskDeletedPayload } from '../types';

export type TaskSocketEventPayload<T = Task> = RealtimeTaskPayload<T>;
export type TaskDeletedSocketPayload = RealtimeTaskDeletedPayload;

let socketInstance: Socket | null = null;
let currentJoinedBoard: string | null = null;

const SOCKET_SERVER_URL =
  (typeof process !== 'undefined' && process.env?.VITE_SOCKET_URL) ||
  (typeof window !== 'undefined' && (window as any).__SOCKET_URL__) ||
  'http://localhost:4000';

/**
 * Initializes or returns the singleton Socket.io client
 */
export function getSocketClient(token?: string | null): Socket {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(SOCKET_SERVER_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    auth: token ? { token } : undefined,
  });

  socketInstance.on('connect', () => {
    // If we had a previously active board before reconnect, re-join the room
    if (currentJoinedBoard && socketInstance) {
      socketInstance.emit('join:board', currentJoinedBoard);
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
 * Joins a specific board room for real-time task sync
 */
export function joinBoardRoom(boardId: string): void {
  currentJoinedBoard = boardId;
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit('join:board', boardId);
  }
}

/**
 * Leaves a specific board room
 */
export function leaveBoardRoom(boardId: string): void {
  if (currentJoinedBoard === boardId) {
    currentJoinedBoard = null;
  }
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit('leave:board', boardId);
  }
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
