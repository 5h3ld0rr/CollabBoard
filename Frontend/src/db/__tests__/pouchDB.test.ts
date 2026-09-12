import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { MockPouchDB, dbStores } = vi.hoisted(() => {
  const dbStores = new Map<string, Map<string, any>>();

  class MockPouchDB {
    name: string;
    constructor(name: string) {
      this.name = name;
      if (!dbStores.has(name)) {
        dbStores.set(name, new Map());
      }
    }

    get store() {
      if (!dbStores.has(this.name)) {
        dbStores.set(this.name, new Map());
      }
      return dbStores.get(this.name)!;
    }

    async get(id: string) {
      const doc = this.store.get(id);
      if (!doc) {
        const err: any = new Error('missing');
        err.status = 404;
        throw err;
      }
      return { ...doc, _rev: doc._rev || '1-mock' };
    }

    async put(doc: any) {
      const id = doc._id || doc.id;
      this.store.set(id, { ...doc, _id: id, _rev: '1-mock' });
      return { ok: true, id, rev: '1-mock' };
    }

    async allDocs(options?: any) {
      const rows = Array.from(this.store.values()).map((doc) => ({
        id: doc._id,
        key: doc._id,
        value: { rev: doc._rev },
        doc: options?.include_docs ? { ...doc } : undefined,
      }));
      return { total_rows: rows.length, offset: 0, rows };
    }

    async remove(doc: any) {
      const id = doc._id || doc.id;
      this.store.delete(id);
      return { ok: true, id, rev: '2-mock' };
    }

    async bulkDocs(docs: any[]) {
      for (const d of docs) {
        const id = d._id || d.id;
        if (d._deleted) {
          this.store.delete(id);
        } else {
          this.store.set(id, { ...d, _id: id, _rev: '1-mock' });
        }
      }
      return docs.map((d) => ({ ok: true, id: d._id || d.id, rev: '1-mock' }));
    }

    async destroy() {
      dbStores.delete(this.name);
    }
  }

  return { MockPouchDB, dbStores };
});

vi.mock('pouchdb-browser', () => ({
  default: MockPouchDB,
}));

import {
  saveBoardToCache,
  getCachedBoards,
  getCachedBoard,
  deleteCachedBoard,
  saveTasksToCache,
  getCachedTasks,
  getCachedTask,
  updateCachedTask,
  deleteCachedTask,
  clearCachedBoardTasks,
  setLastSyncTime,
  getLastSyncTime,
  enqueueMutation,
  getQueuedMutations,
  dequeueMutation,
  clearQueuedMutations,
  saveCachedUser,
  getCachedUser,
  clearCachedUser,
  saveCachedProfileDetails,
  getCachedProfileDetails,
  clearAllLocalCache,
} from '../pouchDB';
import type { Board, Task, User } from '../../types';

describe('db/pouchDB', () => {
  beforeEach(async () => {
    dbStores.clear();
    await clearAllLocalCache();
  });

  afterEach(async () => {
    dbStores.clear();
    await clearAllLocalCache();
  });

  describe('Board Cache', () => {
    const sampleBoard: Board = {
      id: 'b_123',
      workspaceId: 'w_1',
      title: 'Sprint Board',
      description: 'Test board',
      members: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    } as unknown as Board;

    it('saves and retrieves a board from cache', async () => {
      await saveBoardToCache(sampleBoard);
      const retrieved = await getCachedBoard('b_123');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('b_123');
      expect(retrieved?.title).toBe('Sprint Board');
    });

    it('returns null when board is not cached', async () => {
      const nonExistent = await getCachedBoard('non_existent');
      expect(nonExistent).toBeNull();
    });

    it('retrieves all cached boards', async () => {
      await saveBoardToCache(sampleBoard);
      await saveBoardToCache({ ...sampleBoard, id: 'b_456', title: 'Second Board' });

      const all = await getCachedBoards();
      expect(all.length).toBe(2);
      expect(all.map((b) => b.id)).toContain('b_123');
      expect(all.map((b) => b.id)).toContain('b_456');
    });

    it('deletes board and associated tasks from cache', async () => {
      await saveBoardToCache(sampleBoard);
      const task: Task = {
        id: 't_1',
        boardId: 'b_123',
        title: 'Task 1',
        status: 'todo',
        priority: 'medium',
        order: 1,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      } as unknown as Task;
      await saveTasksToCache([task]);

      await deleteCachedBoard('b_123');
      const retrievedBoard = await getCachedBoard('b_123');
      expect(retrievedBoard).toBeNull();

      const tasksAfter = await getCachedTasks('b_123');
      expect(tasksAfter).toEqual([]);
    });
  });

  describe('Task Cache', () => {
    const sampleTask: Task = {
      id: 't_123',
      boardId: 'b_1',
      title: 'Design UI',
      status: 'todo',
      priority: 'high',
      order: 1,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    } as unknown as Task;

    it('saves, updates, and retrieves tasks', async () => {
      await saveTasksToCache([sampleTask]);
      const retrieved = await getCachedTask('t_123');
      expect(retrieved?.title).toBe('Design UI');

      await updateCachedTask({ ...sampleTask, title: 'Design UI Updated', status: 'in-progress' });
      const updated = await getCachedTask('t_123');
      expect(updated?.title).toBe('Design UI Updated');
      expect(updated?.status).toBe('in-progress');

      const boardTasks = await getCachedTasks('b_1');
      expect(boardTasks.length).toBe(1);
    });

    it('deletes cached task and clears board tasks', async () => {
      await saveTasksToCache([
        sampleTask,
        { ...sampleTask, id: 't_456', title: 'Task 2' },
        { ...sampleTask, id: 't_789', boardId: 'b_2', title: 'Other Board Task' },
      ]);

      await deleteCachedTask('t_123');
      expect(await getCachedTask('t_123')).toBeNull();

      await clearCachedBoardTasks('b_1');
      const remainingB1 = await getCachedTasks('b_1');
      expect(remainingB1.length).toBe(0);

      const b2Tasks = await getCachedTasks('b_2');
      expect(b2Tasks.length).toBe(1);
    });
  });

  describe('Sync Metadata', () => {
    it('sets and retrieves last sync timestamp', async () => {
      expect(await getLastSyncTime('boards')).toBeNull();
      const time = 1750000000;
      await setLastSyncTime('boards', time);
      expect(await getLastSyncTime('boards')).toBe(time);
    });
  });

  describe('Mutation Queue', () => {
    it('enqueues, retrieves in FIFO order, and dequeues mutations', async () => {
      const mut1 = await enqueueMutation({
        type: 'CREATE_TASK',
        entityId: 'temp_1',
        payload: { title: 'T1' },
      });

      const mut2 = await enqueueMutation({
        type: 'UPDATE_TASK',
        entityId: 'temp_2',
        payload: { title: 'T2' },
      });

      const queued = await getQueuedMutations();
      expect(queued.length).toBe(2);
      expect(queued[0].id).toBe(mut1.id);
      expect(queued[1].id).toBe(mut2.id);

      await dequeueMutation(mut1.id);
      const remaining = await getQueuedMutations();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(mut2.id);

      await clearQueuedMutations();
      expect(await getQueuedMutations()).toEqual([]);
    });
  });

  describe('User and Profile Cache', () => {
    const sampleUser: User = {
      id: 'u_1',
      name: 'John Doe',
      email: 'john@example.com',
    } as unknown as User;

    it('saves, gets, and clears cached user', async () => {
      await saveCachedUser(sampleUser);
      const user = await getCachedUser();
      expect(user?.name).toBe('John Doe');
      expect(user?.email).toBe('john@example.com');

      await clearCachedUser();
      expect(await getCachedUser()).toBeNull();
    });

    it('saves and retrieves cached profile details', async () => {
      const details = { bio: 'Engineer', theme: 'dark' };
      await saveCachedProfileDetails(details);
      const cached = await getCachedProfileDetails();
      expect(cached).toEqual(details);
    });
  });
});
