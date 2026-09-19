import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReconnectionRecovery } from '../useReconnectionRecovery';
import * as socketClientModule from '../../sync/socketClient';
import * as syncManagerModule from '../../sync/syncManager';

vi.mock('../../sync/syncManager', () => ({
  flushSyncQueue: vi.fn().mockResolvedValue({ processed: 2, remaining: 0 }),
}));

describe('Member 3: Shamika Madushan - Reconnection Resilience & Recovery Suite', () => {
  let mockSocket: any;
  let listeners: Record<string, ((...args: any[]) => void)[]>;

  beforeEach(() => {
    vi.clearAllMocks();
    listeners = {};

    mockSocket = {
      connected: true,
      emit: vi.fn(),
      connect: vi.fn(),
      on: vi.fn((event: string, cb: any) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
      }),
      off: vi.fn((event: string, cb: any) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((fn) => fn !== cb);
        }
      }),
    };

    vi.spyOn(socketClientModule, 'getSocketClient').mockReturnValue(mockSocket);
    vi.spyOn(socketClientModule, 'joinBoardRoom').mockImplementation((boardId: string) => {
      mockSocket.emit('board:join', boardId);
    });
  });

  it('re-joins board room, refetches board via REST, and drains offline queue on connect (Slide 18)', async () => {
    const onRefetchBoard = vi.fn().mockResolvedValue(undefined);
    const onDrainQueue = vi.fn().mockResolvedValue(undefined);
    const onOnlineChange = vi.fn();

    const { result } = renderHook(() =>
      useReconnectionRecovery({
        boardId: 'board-recover-456',
        socket: mockSocket,
        onRefetchBoard,
        onDrainQueue,
        onOnlineChange,
      })
    );

    expect(result.current.isOnline).toBe(true);
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

    // Simulate socket reconnect event
    await act(async () => {
      for (const cb of listeners['connect'] || []) {
        await cb();
      }
    });

    // 1. Room re-joined
    expect(mockSocket.emit).toHaveBeenCalledWith('board:join', 'board-recover-456');
    // 2. REST board refetched
    expect(onRefetchBoard).toHaveBeenCalledTimes(1);
    // 3. Offline queue drained
    expect(onDrainQueue).toHaveBeenCalledTimes(1);
    expect(onOnlineChange).toHaveBeenCalledWith(true);
  });

  it('falls back to default flushSyncQueue when onDrainQueue is not provided', async () => {
    renderHook(() =>
      useReconnectionRecovery({
        boardId: 'board-recover-789',
        socket: mockSocket,
      })
    );

    await act(async () => {
      for (const cb of listeners['connect'] || []) {
        await cb();
      }
    });

    expect(syncManagerModule.flushSyncQueue).toHaveBeenCalledTimes(1);
  });

  it('handles disconnect and performs manual restart on io server disconnect (Slide 18)', async () => {
    const onOnlineChange = vi.fn();

    const { result } = renderHook(() =>
      useReconnectionRecovery({
        boardId: 'board-disconnect-test',
        socket: mockSocket,
        onOnlineChange,
      })
    );

    // Standard client disconnect
    act(() => {
      for (const cb of listeners['disconnect'] || []) {
        cb('transport close');
      }
    });

    expect(result.current.isOnline).toBe(false);
    expect(onOnlineChange).toHaveBeenCalledWith(false);
    expect(mockSocket.connect).not.toHaveBeenCalled();

    // Server-side forceful disconnect
    act(() => {
      for (const cb of listeners['disconnect'] || []) {
        cb('io server disconnect');
      }
    });

    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listeners on unmount to prevent duplicate handlers (Slide 17 item 4)', () => {
    const { unmount } = renderHook(() =>
      useReconnectionRecovery({
        boardId: 'board-cleanup-test',
        socket: mockSocket,
      })
    );

    expect(mockSocket.on).toHaveBeenCalledTimes(2);

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(listeners['connect']).toHaveLength(0);
    expect(listeners['disconnect']).toHaveLength(0);
  });
});
