import PouchDB from 'pouchdb-browser';
import type { Board, Task, User } from '../types';

// ---------------------------------------------------------------------------
// Database instances — lazy-initialized to avoid opening IndexedDB prematurely
// ---------------------------------------------------------------------------

let _boardsDB:  PouchDB.Database<Board> | null = null;
let _tasksDB:   PouchDB.Database<Task> | null = null;
let _metaDB:    PouchDB.Database<{ key: string; timestamp: number }> | null = null;
let _userDB:    PouchDB.Database<User & { id: string }> | null = null;
let _profileDB: PouchDB.Database<{ id: string; details: any }> | null = null;

function getBoardsDB()  { return _boardsDB  ??= new PouchDB<Board>('collabboard_boards'); }
function getTasksDB()   { return _tasksDB   ??= new PouchDB<Task>('collabboard_tasks'); }
function getMetaDB()    { return _metaDB    ??= new PouchDB<{ key: string; timestamp: number }>('collabboard_meta'); }
function getUserDB()    { return _userDB    ??= new PouchDB<User & { id: string }>('collabboard_user'); }
function getProfileDB() { return _profileDB ??= new PouchDB<{ id: string; details: any }>('collabboard_profile'); }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map our domain id → PouchDB _id on write.
 * Strips any Mongoose / Mongo internal keys starting with '_' (such as __v)
 * which CouchDB/PouchDB strictly disallows as reserved document members.
 */
function toDoc<T extends { id: string }>(doc: T): T & PouchDB.Core.IdMeta {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc as Record<string, unknown>)) {
    if (!key.startsWith('_')) {
      clean[key] = value;
    }
  }
  clean._id = doc.id;
  return clean as unknown as T & PouchDB.Core.IdMeta;
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
    const result = await getBoardsDB().allDocs({ include_docs: true });
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
    const doc = await getBoardsDB().get(boardId);
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
    await Promise.all(boards.filter(b => b?.id).map(b => upsert(getBoardsDB(), b)));
  } catch (err) {
    console.warn('[PouchDB] Failed to save boards to cache:', err);
  }
}

export async function saveBoardToCache(board: Board): Promise<void> {
  if (!board?.id) return;
  try {
    await upsert(getBoardsDB(), board);
  } catch (err) {
    console.warn('[PouchDB] Failed to save board ' + board.id + ' to cache:', err);
  }
}

export async function deleteCachedBoard(boardId: string): Promise<void> {
  try {
    try {
      const doc = await getBoardsDB().get(boardId);
      await getBoardsDB().remove(doc);
    } catch (err: unknown) {
      if ((err as PouchDB.Core.Error).status !== 404) throw err;
    }

    const result = await getTasksDB().allDocs({ include_docs: true });
    const boardTasks = result.rows
      .filter(row => row.doc && (row.doc as unknown as Task).boardId === boardId)
      .map(row => ({ ...row.doc!, _deleted: true as const }));

    if (boardTasks.length > 0) {
      await getTasksDB().bulkDocs(boardTasks);
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
    const result = await getTasksDB().allDocs({ include_docs: true });
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
    const doc = await getTasksDB().get(taskId);
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
    await Promise.all(tasks.filter(t => t?.id).map(t => upsert(getTasksDB(), t)));
  } catch (err) {
    console.warn('[PouchDB] Failed to save tasks to cache:', err);
  }
}

export async function updateCachedTask(task: Task): Promise<void> {
  if (!task?.id) return;
  try {
    await upsert(getTasksDB(), task);
  } catch (err) {
    console.warn('[PouchDB] Failed to update cached task ' + task.id + ':', err);
  }
}

export async function deleteCachedTask(taskId: string): Promise<void> {
  try {
    const doc = await getTasksDB().get(taskId);
    await getTasksDB().remove(doc);
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return;
    console.warn('[PouchDB] Failed to delete cached task ' + taskId + ':', err);
  }
}

export async function clearCachedBoardTasks(boardId: string): Promise<void> {
  try {
    const result = await getTasksDB().allDocs({ include_docs: true });
    const toDelete = result.rows
      .filter(row => row.doc && (row.doc as unknown as Task).boardId === boardId)
      .map(row => ({ ...row.doc!, _deleted: true as const }));

    if (toDelete.length > 0) {
      await getTasksDB().bulkDocs(toDelete);
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
    const metaTyped = getMetaDB() as unknown as PouchDB.Database<{ id: string; key: string; timestamp: number } & object>;
    await upsert(metaTyped, { id: key, key, timestamp });
  } catch (err) {
    console.warn('[PouchDB] Failed to set last sync for ' + key + ':', err);
  }
}

export async function getLastSyncTime(key: string): Promise<number | null> {
  try {
    const doc = await getMetaDB().get(key);
    return (doc as unknown as { timestamp: number }).timestamp ?? null;
  } catch (err: unknown) {
    if ((err as PouchDB.Core.Error).status === 404) return null;
    return null;
  }
}

export async function clearAllLocalCache(): Promise<void> {
  try {
    if (_boardsDB)  { await _boardsDB.destroy();  _boardsDB  = null; }
    if (_tasksDB)   { await _tasksDB.destroy();   _tasksDB   = null; }
    if (_metaDB)    { await _metaDB.destroy();    _metaDB    = null; }
    if (_userDB)    { await _userDB.destroy();    _userDB    = null; }
    if (_profileDB) { await _profileDB.destroy(); _profileDB = null; }
  } catch (err) {
    console.warn('[PouchDB] Failed to clear all cache:', err);
  }
}

// ---------------------------------------------------------------------------
// User & Profile Cache Operations
// ---------------------------------------------------------------------------

export async function saveCachedUser(user: User): Promise<void> {
  try {
    await upsert(getUserDB() as unknown as PouchDB.Database<User & { id: string } & object>, {
      ...user,
      id: 'current_user',
    });
  } catch (err) {
    console.warn('[PouchDB] Failed to cache user:', err);
  }
}

export async function getCachedUser(): Promise<User | null> {
  try {
    const doc = await getUserDB().get('current_user');
    return fromDoc(doc as unknown as PouchDB.Core.ExistingDocument<User & { id: string } & object>);
  } catch {
    return null;
  }
}

export async function clearCachedUser(): Promise<void> {
  try {
    const doc = await getUserDB().get('current_user');
    await getUserDB().remove(doc);
  } catch {
    // Ignore if doesn't exist
  }
}

export async function saveCachedProfileDetails(details: any): Promise<void> {
  try {
    await upsert(getProfileDB() as unknown as PouchDB.Database<{ id: string; details: any } & object>, {
      id: 'profile_details',
      details,
    });
  } catch (err) {
    console.warn('[PouchDB] Failed to cache profile details:', err);
  }
}

export async function getCachedProfileDetails(): Promise<any | null> {
  try {
    const doc = await getProfileDB().get('profile_details');
    return (doc as any).details ?? null;
  } catch {
    return null;
  }
}
