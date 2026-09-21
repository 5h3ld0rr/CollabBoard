import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as socketIoClient from 'socket.io-client';
import {
  getSocketClient,
  disconnectSocket,
  isSocketConnected,
  getActiveJoinedBoard,
  onSocketAuthError,
  subscribeSocketConnection,
  joinBoardRoom,
  leaveBoardRoom,
  subscribeTaskCreated,
  subscribeTaskUpdated,
  subscribeBoardUpdated,
  subscribePresenceUpdate,
  subscribeDirectNotification,
} from '../socketClient';

vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(),
  };
});

describe('Member 3: Shamika Madushan - Socket Client & Reconnection Resilience Suite', () => {
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

  it('subscribes to and unregisters notification:direct events', () => {
    const callback = vi.fn();
    const unsub = subscribeDirectNotification(callback);

    expect(mockSocket.on).toHaveBeenCalledWith('notification:direct', callback);
    unsub();
    expect(mockSocket.off).toHaveBeenCalledWith('notification:direct', callback);
  });

  it('re-joins active board room on reconnect', () => {
    let connectCallback: any;
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

  it('tracks socket connection state and active board room correctly', () => {
    expect(isSocketConnected()).toBe(false);
    expect(getActiveJoinedBoard()).toBeNull();

    getSocketClient();
    expect(isSocketConnected()).toBe(true);

    joinBoardRoom('board-state-test');
    expect(getActiveJoinedBoard()).toBe('board-state-test');

    leaveBoardRoom('board-state-test');
    expect(getActiveJoinedBoard()).toBeNull();
  });

  it('handles connect_error and notifies onSocketAuthError listeners on BAD_TOKEN / NO_TOKEN', () => {
    let connectErrorCallback: any;
    mockSocket.on.mockImplementation((event: string, cb: any) => {
      if (event === 'connect_error') {
        connectErrorCallback = cb;
      }
    });

    getSocketClient();

    const authErrorListener = vi.fn();
    const unsub = onSocketAuthError(authErrorListener);

    // Simulate BAD_TOKEN error from server handshake
    connectErrorCallback?.({ message: 'BAD_TOKEN' });
    expect(authErrorListener).toHaveBeenCalledWith('BAD_TOKEN');

    // Simulate NO_TOKEN error
    connectErrorCallback?.({ message: 'NO_TOKEN' });
    expect(authErrorListener).toHaveBeenCalledWith('NO_TOKEN');

    unsub();
  });

  it('subscribes to connect and disconnect lifecycle with manual restart on io server disconnect', () => {
    let connectCb: any;
    let disconnectCb: any;

    mockSocket.on.mockImplementation((event: string, cb: any) => {
      if (event === 'connect') connectCb = cb;
      if (event === 'disconnect') disconnectCb = cb;
    });

    mockSocket.connect = vi.fn();
    getSocketClient();

    const onConnect = vi.fn();
    const onDisconnect = vi.fn();

    const unsub = subscribeSocketConnection(onConnect, onDisconnect);

    connectCb?.();
    expect(onConnect).toHaveBeenCalledTimes(1);

    // Standard client/transport disconnect
    disconnectCb?.('transport close');
    expect(onDisconnect).toHaveBeenCalledWith('transport close');
    expect(mockSocket.connect).not.toHaveBeenCalled();

    // Forceful server-side disconnect triggers manual restart (Slide 18)
    disconnectCb?.('io server disconnect');
    expect(onDisconnect).toHaveBeenCalledWith('io server disconnect');
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);

    unsub();
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });
});
