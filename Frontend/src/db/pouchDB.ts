import PouchDB from 'pouchdb-browser';
import type { Board, Task } from '../types';

// ---------------------------------------------------------------------------
// Database instances  (one per logical "store" for clean separation)
// ---------------------------------------------------------------------------

const boardsDB = new PouchDB<Board>('collabboard_boards');
const tasksDB  = new PouchDB<Task>('collabboard_tasks');
const metaDB   = new PouchDB<{ key: string; timestamp: number }>('collabboard_meta');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map our domain id → PouchDB _id on write */
function toDoc<T extends { id: string }>(doc: T): T & PouchDB.Core.IdMeta {
  return { ...doc, _id: doc.id };
}

/** Strip PouchDB internals from a retrieved document */
function fromDoc<T>(doc: PouchDB.Core.ExistingDocument<T & object>): T {
  const { _id, _rev, ...rest } = doc as Record<string, unknown>;
  void _id; void _rev;
  return rest as T;
}

/**
 * Upsert a single document: fetch its current _rev so PouchDB does not
 * throw a 409 conflict, then put the updated version.
 */
async function upsert<T extends { id: string }>(
  db: PouchDB.Database<T & object>,
  doc: T,
): Promise<void> {
  const pouchDoc = toDoc(doc);
  try {
    const existing = await db.get(pouchDoc._id);
    await db.put({ ...pouchDoc, _rev: existing._rev });
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) {
      await db.put(pouchDoc);
    } else {
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Board Cache Operations
// ---------------------------------------------------------------------------

export async function getCachedBoards(): Promise<Board[]> {
  try {
    const result = await boardsDB.allDocs({ include_docs: true });
    return result.rows
      .filter(row => row.doc)
      .map(row => fromDoc(row.doc!));
  } catch (err) {
    console.warn('[PouchDB] Failed to get cached boards:', err);
    return [];
  }
}

export async function getCachedBoard(boardId: string): Promise<Board | null> {
  try {
    const doc = await boardsDB.get(boardId);
    return fromDoc(doc);
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return null;
    console.warn('[PouchDB] Failed to get cached board ' + boardId + ':', err);
    return null;
  }
}

export async function saveBoardsToCache(boards: Board[]): Promise<void> {
  if (!Array.isArray(boards) || boards.length === 0) return;
  try {
    await Promise.all(boards.filter(b => b?.id).map(b => upsert(boardsDB, b)));
  } catch (err) {
    console.warn('[PouchDB] Failed to save boards to cache:', err);
  }
}

export async function saveBoardToCache(board: Board): Promise<void> {
  if (!board?.id) return;
  try {
    await upsert(boardsDB, board);
  } catch (err) {
    console.warn('[PouchDB] Failed to save board ' + board.id + ' to cache:', err);
  }
}

export async function deleteCachedBoard(boardId: string): Promise<void> {
  try {
    try {
      const doc = await boardsDB.get(boardId);
      await boardsDB.remove(doc);
    } catch (err: unknown) {
      if ((err as PouchDB.Core.Error).status !== 404) throw err;
    }

    const result = await tasksDB.allDocs({ include_docs: true });
    const boardTasks = result.rows
      .filter(row => row.doc && (row.doc as unknown as Task).boardId === boardId)
      .map(row => ({ ...row.doc!, _deleted: true as const }));

    if (boardTasks.length > 0) {
      await tasksDB.bulkDocs(boardTasks);
    }
  } catch (err) {
    console.warn('[PouchDB] Failed to delete board ' + boardId + ' from cache:', err);
  }
}

// ---------------------------------------------------------------------------
// Tasks Cache Operations
// ---------------------------------------------------------------------------

export async function getCachedTasks(boardId?: string): Promise<Task[]> {
  try {
    const result = await tasksDB.allDocs({ include_docs: true });
    const all = result.rows
      .filter(row => row.doc)
      .map(row => fromDoc(row.doc!));
    return boardId ? all.filter(t => t.boardId === boardId) : all;
  } catch (err) {
    console.warn('[PouchDB] Failed to get cached tasks for board ' + boardId + ':', err);
    return [];
  }
}

export async function getCachedTask(taskId: string): Promise<Task | null> {
  try {
    const doc = await tasksDB.get(taskId);
    return fromDoc(doc);
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return null;
    console.warn('[PouchDB] Failed to get cached task ' + taskId + ':', err);
    return null;
  }
}

export async function saveTasksToCache(tasks: Task[], clearBoardId?: string): Promise<void> {
  if (!Array.isArray(tasks)) return;
  try {
    if (clearBoardId) {
      await clearCachedBoardTasks(clearBoardId);
    }
    await Promise.all(tasks.filter(t => t?.id).map(t => upsert(tasksDB, t)));
  } catch (err) {
    console.warn('[PouchDB] Failed to save tasks to cache:', err);
  }
}

export async function updateCachedTask(task: Task): Promise<void> {
  if (!task?.id) return;
  try {
    await upsert(tasksDB, task);
  } catch (err) {
    console.warn('[PouchDB] Failed to update cached task ' + task.id + ':', err);
  }
}

export async function deleteCachedTask(taskId: string): Promise<void> {
  try {
    const doc = await tasksDB.get(taskId);
    await tasksDB.remove(doc);
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return;
    console.warn('[PouchDB] Failed to delete cached task ' + taskId + ':', err);
  }
}

export async function clearCachedBoardTasks(boardId: string): Promise<void> {
  try {
    const result = await tasksDB.allDocs({ include_docs: true });
    const toDelete = result.rows
      .filter(row => row.doc && (row.doc as unknown as Task).boardId === boardId)
      .map(row => ({ ...row.doc!, _deleted: true as const }));

    if (toDelete.length > 0) {
      await tasksDB.bulkDocs(toDelete);
    }
  } catch (err) {
    console.warn('[PouchDB] Failed to clear tasks for board ' + boardId + ':', err);
  }
}

// ---------------------------------------------------------------------------
// Sync Metadata & Cache Cleanup
// ---------------------------------------------------------------------------

export async function setLastSyncTime(key: string, timestamp: number = Date.now()): Promise<void> {
  try {
    const metaTyped = metaDB as unknown as PouchDB.Database<{ id: string; key: string; timestamp: number } & object>;
    await upsert(metaTyped, { id: key, key, timestamp });
  } catch (err) {
    console.warn('[PouchDB] Failed to set last sync for ' + key + ':', err);
  }
}

export async function getLastSyncTime(key: string): Promise<number | null> {
  try {
    const doc = await metaDB.get(key);
    return (doc as unknown as { timestamp: number }).timestamp ?? null;
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return null;
    return null;
  }
}

export async function clearAllLocalCache(): Promise<void> {
  try {
    await boardsDB.destroy();
    await tasksDB.destroy();
    await metaDB.destroy();
    // Re-open so the module stays usable after clearing
    const nb = new PouchDB<Board>('collabboard_boards');
    const nt = new PouchDB<Task>('collabboard_tasks');
    const nm = new PouchDB<{ key: string; timestamp: number }>('collabboard_meta');
    Object.assign(boardsDB, nb);
    Object.assign(tasksDB, nt);
    Object.assign(metaDB, nm);
  } catch (err) {
    console.warn('[PouchDB] Failed to clear all cache:', err);
  }
}
