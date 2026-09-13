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
  subscribeBoardUpdated,
  subscribePresenceUpdate,
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

  it('emits board:join when joinBoardRoom or emitBoardJoin is invoked', () => {
    getSocketClient();
    joinBoardRoom('board-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('board:join', 'board-123');
  });

  it('emits board:leave when leaveBoardRoom or emitBoardLeave is invoked', () => {
    getSocketClient();
    joinBoardRoom('board-123');
    leaveBoardRoom('board-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('board:leave', 'board-123');
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

  it('subscribes to and unregisters board:updated events', () => {
    const callback = vi.fn();
    const unsub = subscribeBoardUpdated(callback);

    expect(mockSocket.on).toHaveBeenCalledWith('board:updated', callback);
    unsub();
    expect(mockSocket.off).toHaveBeenCalledWith('board:updated', callback);
  });

  it('subscribes to and unregisters presence:update events', () => {
    const callback = vi.fn();
    const unsub = subscribePresenceUpdate(callback);

    expect(mockSocket.on).toHaveBeenCalledWith('presence:update', callback);
    unsub();
    expect(mockSocket.off).toHaveBeenCalledWith('presence:update', callback);
  });

  it('re-joins active board room on reconnect', () => {
    let connectCallback: (() => void) | null = null;
    mockSocket.on.mockImplementation((event: string, cb: any) => {
      if (event === 'connect') {
        connectCallback = cb;
      }
    });

    getSocketClient();
    joinBoardRoom('board-reconnect-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('board:join', 'board-reconnect-1');

    mockSocket.emit.mockClear();
    // Simulate reconnect event
    connectCallback?.();
    expect(mockSocket.emit).toHaveBeenCalledWith('board:join', 'board-reconnect-1');
  });
});
