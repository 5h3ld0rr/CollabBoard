import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as socketIoClient from 'socket.io-client';
import {
  getSocketClient,
  disconnectSocket,
  joinBoardRoom,
  leaveBoardRoom,
  subscribeTaskCreated,
  subscribeTaskUpdated,
  subscribeTaskDeleted,
} from '../socketClient';

vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(),
  };
});

describe('sync/socketClient', () => {
  let mockSocket: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = {
      connected: true,
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
    };
    (socketIoClient.io as any).mockReturnValue(mockSocket);
    disconnectSocket();
  });

  afterEach(() => {
    disconnectSocket();
  });

  it('initializes socket client with default options and auth token', () => {
    const socket = getSocketClient('test-token');
    expect(socketIoClient.io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'test-token' },
        withCredentials: true,
        transports: ['websocket', 'polling'],
      })
    );
    expect(socket).toBe(mockSocket);
  });

  it('emits join:board when joinBoardRoom is invoked', () => {
    getSocketClient();
    joinBoardRoom('board-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('join:board', 'board-123');
  });

  it('emits leave:board when leaveBoardRoom is invoked', () => {
    getSocketClient();
    joinBoardRoom('board-123');
    leaveBoardRoom('board-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('leave:board', 'board-123');
  });

  it('subscribes to and unregisters task:created events', () => {
    const callback = vi.fn();
    const unsub = subscribeTaskCreated(callback);

    expect(mockSocket.on).toHaveBeenCalledWith('task:created', callback);
    unsub();
    expect(mockSocket.off).toHaveBeenCalledWith('task:created', callback);
  });

  it('subscribes to and unregisters task:updated events', () => {
    const callback = vi.fn();
    const unsub = subscribeTaskUpdated(callback);

    expect(mockSocket.on).toHaveBeenCalledWith('task:updated', callback);
    unsub();
    expect(mockSocket.off).toHaveBeenCalledWith('task:updated', callback);
  });

  it('subscribes to and unregisters task:deleted events', () => {
    const callback = vi.fn();
    const unsub = subscribeTaskDeleted(callback);

    expect(mockSocket.on).toHaveBeenCalledWith('task:deleted', callback);
    unsub();
    expect(mockSocket.off).toHaveBeenCalledWith('task:deleted', callback);
  });
});
