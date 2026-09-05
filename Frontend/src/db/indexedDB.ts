import type { Board, Task } from '../types';

const DB_NAME = 'collabboard_idb';
const DB_VERSION = 1;

const STORES = {
  BOARDS: 'boards',
  TASKS: 'tasks',
  META: 'meta',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes and returns a singleton Promise of the IndexedDB database instance.
 */
export function getIDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment.'));
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Boards Store
        if (!db.objectStoreNames.contains(STORES.BOARDS)) {
          const boardStore = db.createObjectStore(STORES.BOARDS, { keyPath: 'id' });
          boardStore.createIndex('workspaceId', 'workspaceId', { unique: false });
          boardStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Tasks Store
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
          taskStore.createIndex('boardId', 'boardId', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
          taskStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Metadata Store
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event: Event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB open error:', error);
        reject(error);
      };
    });
  }

  return dbPromise;
}

/* ==========================================================================
   Boards Cache Operations
   ========================================================================== */

export async function getCachedBoards(): Promise<Board[]> {
  try {
    const db = await getIDB();
    return new Promise<Board[]>((resolve, reject) => {
      const tx = db.transaction(STORES.BOARDS, 'readonly');
      const store = tx.objectStore(STORES.BOARDS);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as Board[]) || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IDB] Failed to get cached boards:', err);
    return [];
  }
}

export async function getCachedBoard(boardId: string): Promise<Board | null> {
  try {
    const db = await getIDB();
    return new Promise<Board | null>((resolve, reject) => {
      const tx = db.transaction(STORES.BOARDS, 'readonly');
      const store = tx.objectStore(STORES.BOARDS);
      const request = store.get(boardId);

      request.onsuccess = () => resolve((request.result as Board) || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to get cached board ${boardId}:`, err);
    return null;
  }
}

export async function saveBoardsToCache(boards: Board[]): Promise<void> {
  if (!Array.isArray(boards) || boards.length === 0) return;
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.BOARDS, 'readwrite');
      const store = tx.objectStore(STORES.BOARDS);

      for (const board of boards) {
        if (board && board.id) {
          store.put(board);
        }
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IDB] Failed to save boards to cache:', err);
  }
}

export async function saveBoardToCache(board: Board): Promise<void> {
  if (!board || !board.id) return;
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.BOARDS, 'readwrite');
      const store = tx.objectStore(STORES.BOARDS);
      store.put(board);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to save board ${board.id} to cache:`, err);
  }
}

export async function deleteCachedBoard(boardId: string): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORES.BOARDS, STORES.TASKS], 'readwrite');
      const boardStore = tx.objectStore(STORES.BOARDS);
      const taskStore = tx.objectStore(STORES.TASKS);

      boardStore.delete(boardId);

      // Also clean up tasks belonging to this board
      const taskIndex = taskStore.index('boardId');
      const taskReq = taskIndex.getAllKeys(boardId);

      taskReq.onsuccess = () => {
        const keys = taskReq.result;
        for (const key of keys) {
          taskStore.delete(key);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to delete board ${boardId} from cache:`, err);
  }
}

/* ==========================================================================
   Tasks Cache Operations
   ========================================================================== */

export async function getCachedTasks(boardId?: string): Promise<Task[]> {
  try {
    const db = await getIDB();
    return new Promise<Task[]>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readonly');
      const store = tx.objectStore(STORES.TASKS);

      let request: IDBRequest;
      if (boardId) {
        const index = store.index('boardId');
        request = index.getAll(boardId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const results = (request.result as Task[]) || [];
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to get cached tasks for board ${boardId}:`, err);
    return [];
  }
}

export async function getCachedTask(taskId: string): Promise<Task | null> {
  try {
    const db = await getIDB();
    return new Promise<Task | null>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readonly');
      const store = tx.objectStore(STORES.TASKS);
      const request = store.get(taskId);

      request.onsuccess = () => resolve((request.result as Task) || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to get cached task ${taskId}:`, err);
    return null;
  }
}

export async function saveTasksToCache(tasks: Task[], clearBoardId?: string): Promise<void> {
  if (!Array.isArray(tasks)) return;
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readwrite');
      const store = tx.objectStore(STORES.TASKS);

      if (clearBoardId) {
        const index = store.index('boardId');
        const req = index.getAllKeys(clearBoardId);
        req.onsuccess = () => {
          const keys = req.result;
          for (const key of keys) {
            store.delete(key);
          }
          for (const task of tasks) {
            if (task && task.id) {
              store.put(task);
            }
          }
        };
      } else {
        for (const task of tasks) {
          if (task && task.id) {
            store.put(task);
          }
        }
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IDB] Failed to save tasks to cache:', err);
  }
}

export async function updateCachedTask(task: Task): Promise<void> {
  if (!task || !task.id) return;
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readwrite');
      const store = tx.objectStore(STORES.TASKS);
      store.put(task);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to update cached task ${task.id}:`, err);
  }
}

export async function deleteCachedTask(taskId: string): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readwrite');
      const store = tx.objectStore(STORES.TASKS);
      store.delete(taskId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to delete cached task ${taskId}:`, err);
  }
}

export async function clearCachedBoardTasks(boardId: string): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TASKS, 'readwrite');
      const store = tx.objectStore(STORES.TASKS);
      const index = store.index('boardId');
      const req = index.getAllKeys(boardId);

      req.onsuccess = () => {
        const keys = req.result;
        for (const key of keys) {
          store.delete(key);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to clear tasks for board ${boardId}:`, err);
  }
}

/* ==========================================================================
   Sync Metadata & Cache Cleanup
   ========================================================================== */

export async function setLastSyncTime(key: string, timestamp: number = Date.now()): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readwrite');
      const store = tx.objectStore(STORES.META);
      store.put({ key, timestamp });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[IDB] Failed to set last sync for ${key}:`, err);
  }
}

export async function getLastSyncTime(key: string): Promise<number | null> {
  try {
    const db = await getIDB();
    return new Promise<number | null>((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readonly');
      const store = tx.objectStore(STORES.META);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.timestamp : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function clearAllLocalCache(): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORES.BOARDS, STORES.TASKS, STORES.META], 'readwrite');
      tx.objectStore(STORES.BOARDS).clear();
      tx.objectStore(STORES.TASKS).clear();
      tx.objectStore(STORES.META).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IDB] Failed to clear all cache:', err);
  }
}
