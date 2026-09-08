import * as tasksApi from '../api/tasks';
import * as boardsApi from '../api/boards';
import {
  getQueuedMutations,
  dequeueMutation,
  updateCachedTask,
  deleteCachedTask,
  saveBoardToCache,
  deleteCachedBoard,
} from '../db';

let isFlushing = false;

type SyncListener = (event: { count: number; error?: any }) => void;
const syncListeners = new Set<SyncListener>();

export function onSyncComplete(listener: SyncListener) {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

/**
 * Drains the offline mutation outbox queue in FIFO order.
 * Flushes pending mutations to the server once connection is active.
 */
export async function flushSyncQueue(): Promise<{ processed: number; remaining: number }> {
  if (isFlushing || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { processed: 0, remaining: 0 };
  }

  isFlushing = true;
  let processed = 0;

  try {
    const mutations = await getQueuedMutations();
    if (mutations.length === 0) {
      return { processed: 0, remaining: 0 };
    }

    for (const mutation of mutations) {
      // If network dropped mid-flush, break and wait for next online event
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        break;
      }

      try {
        switch (mutation.type) {
          case 'UPDATE_TASK': {
            const updated = await tasksApi.updateTask(mutation.entityId, mutation.payload);
            await updateCachedTask(updated);
            await dequeueMutation(mutation.id);
            processed++;
            break;
          }

          case 'MOVE_TASK_STATUS': {
            const updated = await tasksApi.moveTaskStatus(mutation.entityId, mutation.payload.status);
            await updateCachedTask(updated);
            await dequeueMutation(mutation.id);
            processed++;
            break;
          }

          case 'CREATE_TASK': {
            const created = await tasksApi.createTask(mutation.payload.boardId, mutation.payload);
            if (mutation.entityId && mutation.entityId.startsWith('temp_')) {
              await deleteCachedTask(mutation.entityId);
            }
            await updateCachedTask(created);
            await dequeueMutation(mutation.id);
            processed++;
            break;
          }

          case 'DELETE_TASK': {
            await tasksApi.deleteTask(mutation.entityId);
            await deleteCachedTask(mutation.entityId);
            await dequeueMutation(mutation.id);
            processed++;
            break;
          }

          case 'CREATE_BOARD': {
            const created = await boardsApi.createBoard(mutation.payload);
            if (mutation.entityId && mutation.entityId.startsWith('temp_')) {
              await deleteCachedBoard(mutation.entityId);
            }
            await saveBoardToCache(created);
            await dequeueMutation(mutation.id);
            processed++;
            break;
          }

          case 'UPDATE_BOARD': {
            const updated = await boardsApi.updateBoard(mutation.entityId, mutation.payload);
            await saveBoardToCache(updated);
            await dequeueMutation(mutation.id);
            processed++;
            break;
          }

          case 'DELETE_BOARD': {
            await boardsApi.deleteBoard(mutation.entityId);
            await deleteCachedBoard(mutation.entityId);
            await dequeueMutation(mutation.id);
            processed++;
            break;
          }
        }
      } catch (err: any) {
        // If 404 on delete, consider it successfully resolved
        if ((mutation.type === 'DELETE_TASK' || mutation.type === 'DELETE_BOARD') && err?.status === 404) {
          await dequeueMutation(mutation.id);
          processed++;
          continue;
        }

        // If 409 conflict, stop queue replay for this document so user can resolve conflict
        if (err?.status === 409 || err?.code === 'CONFLICT') {
          console.warn('[SyncManager] Conflict encountered during replay:', err);
          syncListeners.forEach((fn) => fn({ count: processed, error: err }));
          break;
        }

        // If network error occurred mid-replay, break and retain remaining mutations
        console.warn('[SyncManager] Network error during replay, will retry when online:', err);
        break;
      }
    }

    const remaining = (await getQueuedMutations()).length;
    if (processed > 0) {
      syncListeners.forEach((fn) => fn({ count: processed }));
    }
    return { processed, remaining };
  } finally {
    isFlushing = false;
  }
}
