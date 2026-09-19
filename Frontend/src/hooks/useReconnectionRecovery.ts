import { useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocketClient, joinBoardRoom } from '../sync/socketClient';
import { flushSyncQueue } from '../sync/syncManager';

export interface UseReconnectionRecoveryOptions {
  boardId?: string | null;
  socket?: Socket | null;
  onRefetchBoard?: () => Promise<void> | void;
  onDrainQueue?: () => Promise<any> | void;
  onOnlineChange?: (isOnline: boolean) => void;
}

/**
 * Reconnection resilience hook based on Session 5 - Slide 18:
 * "Reconnection: Assume You Missed Something"
 *
 * When Socket.io reconnects:
 * 1. Sets online state to true.
 * 2. Emits board:join to re-join active board room (rooms are lost on reconnect).
 * 3. Re-fetches latest board data via REST.
 * 4. Drains offline mutation queue (Session 3).
 *
 * Automatically removes listeners on unmount to prevent duplicate handlers (Slide 17).
 */
export function useReconnectionRecovery({
  boardId,
  socket,
  onRefetchBoard,
  onDrainQueue,
  onOnlineChange,
}: UseReconnectionRecoveryOptions = {}) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const activeSocket = socket || getSocketClient();

  const refetchRef = useRef(onRefetchBoard);
  refetchRef.current = onRefetchBoard;

  const drainQueueRef = useRef(onDrainQueue);
  drainQueueRef.current = onDrainQueue;

  const onlineChangeRef = useRef(onOnlineChange);
  onlineChangeRef.current = onOnlineChange;

  useEffect(() => {
    if (!activeSocket) return;

    const onConnect = async () => {
      setIsOnline(true);
      onlineChangeRef.current?.(true);

      if (boardId) {
        // Rooms are lost on reconnect - re-join room (Slide 18)
        joinBoardRoom(boardId);
      }

      // Re-fetch board via REST to recover missed events during disconnection
      if (refetchRef.current) {
        try {
          await refetchRef.current();
        } catch (err) {
          console.error('[ReconnectionRecovery] Board refetch failed:', err);
        }
      }

      // Drain offline mutation queue
      if (drainQueueRef.current) {
        try {
          await drainQueueRef.current();
        } catch (err) {
          console.error('[ReconnectionRecovery] Custom queue drain failed:', err);
        }
      } else {
        try {
          await flushSyncQueue();
        } catch (err) {
          console.error('[ReconnectionRecovery] Offline queue flush failed:', err);
        }
      }
    };

    const onDisconnect = (reason: string) => {
      setIsOnline(false);
      onlineChangeRef.current?.(false);

      // Slide 18: If the server disconnected the socket forcefully, trigger manual restart
      if (reason === 'io server disconnect') {
        activeSocket.connect();
      }
    };

    activeSocket.on('connect', onConnect);
    activeSocket.on('disconnect', onDisconnect);

    // Slide 17 item 4: Cleanup function removes listeners to prevent duplicate handlers on remount
    return () => {
      activeSocket.off('connect', onConnect);
      activeSocket.off('disconnect', onDisconnect);
    };
  }, [activeSocket, boardId]);

  return { isOnline };
}
