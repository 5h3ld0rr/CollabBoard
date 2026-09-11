import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushSyncQueue, onSyncComplete } from '../syncManager';
import * as tasksApi from '../../api/tasks';
import * as boardsApi from '../../api/boards';
import * as db from '../../db';

vi.mock('../../api/tasks');
vi.mock('../../api/boards');
vi.mock('../../db');

describe('sync/syncManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 0 processed if navigator is offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const result = await flushSyncQueue();
    expect(result).toEqual({ processed: 0, remaining: 0 });
    expect(db.getQueuedMutations).not.toHaveBeenCalled();
  });

  it('returns 0 processed when queue is empty', async () => {
    vi.spyOn(db, 'getQueuedMutations').mockResolvedValue([]);
    const result = await flushSyncQueue();
    expect(result).toEqual({ processed: 0, remaining: 0 });
  });

  it('successfully processes UPDATE_TASK, MOVE_TASK_STATUS, and CREATE_TASK with temp ID replacement', async () => {
    const mutations = [
      { id: 'm1', type: 'UPDATE_TASK' as const, entityId: 't1', payload: { title: 'Updated' }, createdAt: 1 },
      { id: 'm2', type: 'MOVE_TASK_STATUS' as const, entityId: 't1', payload: { status: 'done' }, createdAt: 2 },
      { id: 'm3', type: 'CREATE_TASK' as const, entityId: 'temp_t3', payload: { boardId: 'b1', title: 'New' }, createdAt: 3 },
    ];

    vi.spyOn(db, 'getQueuedMutations')
      .mockResolvedValueOnce(mutations as any)
      .mockResolvedValueOnce([]); // remaining empty

    vi.spyOn(tasksApi, 'updateTask').mockResolvedValue({ id: 't1', title: 'Updated' } as any);
    vi.spyOn(tasksApi, 'moveTaskStatus').mockResolvedValue({ id: 't1', status: 'done' } as any);
    vi.spyOn(tasksApi, 'createTask').mockResolvedValue({ id: 'real_t3', title: 'New' } as any);

    const listener = vi.fn();
    const unsubscribe = onSyncComplete(listener);

    const result = await flushSyncQueue();
    expect(result).toEqual({ processed: 3, remaining: 0 });
    expect(tasksApi.updateTask).toHaveBeenCalledWith('t1', { title: 'Updated' });
    expect(tasksApi.moveTaskStatus).toHaveBeenCalledWith('t1', 'done');
    expect(tasksApi.createTask).toHaveBeenCalledWith('b1', { boardId: 'b1', title: 'New' });
    expect(db.deleteCachedTask).toHaveBeenCalledWith('temp_t3');
    expect(db.dequeueMutation).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenCalledWith({ count: 3 });

    unsubscribe();
  });

  it('successfully processes DELETE_TASK, CREATE_BOARD, UPDATE_BOARD, and DELETE_BOARD', async () => {
    const mutations = [
      { id: 'm1', type: 'DELETE_TASK' as const, entityId: 't1', payload: {}, createdAt: 1 },
      { id: 'm2', type: 'CREATE_BOARD' as const, entityId: 'temp_b1', payload: { title: 'New Board' }, createdAt: 2 },
      { id: 'm3', type: 'UPDATE_BOARD' as const, entityId: 'b2', payload: { title: 'Updated Board' }, createdAt: 3 },
      { id: 'm4', type: 'DELETE_BOARD' as const, entityId: 'b3', payload: {}, createdAt: 4 },
    ];

    vi.spyOn(db, 'getQueuedMutations')
      .mockResolvedValueOnce(mutations as any)
      .mockResolvedValueOnce([]);

    vi.spyOn(tasksApi, 'deleteTask').mockResolvedValue(true);
    vi.spyOn(boardsApi, 'createBoard').mockResolvedValue({ id: 'real_b1', title: 'New Board' } as any);
    vi.spyOn(boardsApi, 'updateBoard').mockResolvedValue({ id: 'b2', title: 'Updated Board' } as any);
    vi.spyOn(boardsApi, 'deleteBoard').mockResolvedValue(true);

    const result = await flushSyncQueue();
    expect(result.processed).toBe(4);
    expect(db.deleteCachedTask).toHaveBeenCalledWith('t1');
    expect(db.deleteCachedBoard).toHaveBeenCalledWith('temp_b1');
    expect(db.saveBoardToCache).toHaveBeenCalledWith({ id: 'real_b1', title: 'New Board' });
    expect(boardsApi.deleteBoard).toHaveBeenCalledWith('b3');
    expect(db.deleteCachedBoard).toHaveBeenCalledWith('b3');
  });

  it('handles 404 deletion gracefully by dequeuing mutation and proceeding', async () => {
    const mutations = [
      { id: 'm1', type: 'DELETE_TASK' as const, entityId: 't_missing', payload: {}, createdAt: 1 },
    ];

    vi.spyOn(db, 'getQueuedMutations')
      .mockResolvedValueOnce(mutations as any)
      .mockResolvedValueOnce([]);

    vi.spyOn(tasksApi, 'deleteTask').mockRejectedValue({ status: 404 });

    const result = await flushSyncQueue();
    expect(result.processed).toBe(1);
    expect(db.dequeueMutation).toHaveBeenCalledWith('m1');
  });

  it('handles 409 conflict by stopping replay and notifying listeners with error', async () => {
    const mutations = [
      { id: 'm1', type: 'UPDATE_TASK' as const, entityId: 't1', payload: { title: 'Conflict' }, createdAt: 1 },
      { id: 'm2', type: 'UPDATE_TASK' as const, entityId: 't2', payload: { title: 'Unreached' }, createdAt: 2 },
    ];

    vi.spyOn(db, 'getQueuedMutations')
      .mockResolvedValueOnce(mutations as any)
      .mockResolvedValueOnce([mutations[1]] as any);

    const conflictError = { status: 409, message: 'Version mismatch' };
    vi.spyOn(tasksApi, 'updateTask').mockRejectedValue(conflictError);

    const listener = vi.fn();
    const unsubscribe = onSyncComplete(listener);

    const result = await flushSyncQueue();
    expect(result.processed).toBe(0);
    expect(result.remaining).toBe(1);
    expect(listener).toHaveBeenCalledWith({ count: 0, error: conflictError });

    unsubscribe();
  });
});
