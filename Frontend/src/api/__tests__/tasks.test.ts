import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as tasksApi from '../tasks';
import * as clientModule from '../client';

vi.mock('../client');

describe('api/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getTasks builds correct query string with and without boardId', async () => {
    const mockTasks = [{ id: 't1', title: 'Task 1' }];
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: mockTasks });

    const result = await tasksApi.getTasks('b1', { status: 'todo' });
    expect(result).toEqual(mockTasks);
    expect(clientModule.request).toHaveBeenCalledWith('/api/tasks?status=todo&boardId=b1');

    const resultAll = await tasksApi.getTasks();
    expect(resultAll).toEqual(mockTasks);
    expect(clientModule.request).toHaveBeenCalledWith('/api/tasks');
  });

  it('getBoardTasks queries nested board tasks endpoint', async () => {
    const mockTasks = [{ id: 't2', title: 'Task 2' }];
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: mockTasks });

    const result = await tasksApi.getBoardTasks('b1', { limit: '10' });
    expect(result).toEqual(mockTasks);
    expect(clientModule.request).toHaveBeenCalledWith('/api/boards/b1/tasks?limit=10');
  });

  it('getTaskById returns task or null on error', async () => {
    const mockTask = { id: 't1', title: 'Task 1' };
    vi.spyOn(clientModule, 'request').mockResolvedValueOnce({ data: mockTask });

    const found = await tasksApi.getTaskById('t1');
    expect(found).toEqual(mockTask);

    vi.spyOn(clientModule, 'request').mockRejectedValueOnce(new Error('Fail'));
    const missing = await tasksApi.getTaskById('t99');
    expect(missing).toBeNull();
  });

  it('createTask, updateTask, moveTaskStatus and deleteTask', async () => {
    const mockTask = { id: 't1', title: 'Task 1', status: 'todo' };
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: mockTask });

    const created = await tasksApi.createTask('b1', { title: 'Task 1' });
    expect(created).toEqual(mockTask);
    expect(clientModule.request).toHaveBeenCalledWith('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Task 1', boardId: 'b1' }),
    });

    const updated = await tasksApi.updateTask('t1', { priority: 'high' });
    expect(updated).toEqual(mockTask);
    expect(clientModule.request).toHaveBeenCalledWith('/api/tasks/t1', {
      method: 'PATCH',
      body: JSON.stringify({ priority: 'high' }),
    });

    await tasksApi.moveTaskStatus('t1', 'done');
    expect(clientModule.request).toHaveBeenCalledWith('/api/tasks/t1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'done' }),
    });

    const deleted = await tasksApi.deleteTask('t1');
    expect(deleted).toBe(true);
    expect(clientModule.request).toHaveBeenCalledWith('/api/tasks/t1', { method: 'DELETE' });
  });

  it('handles comments: getTaskComments, addComment, and deleteComment', async () => {
    const mockComments = [{ id: 'c1', content: 'Nice job' }];
    vi.spyOn(clientModule, 'request').mockResolvedValueOnce({ data: mockComments });

    const comments = await tasksApi.getTaskComments('t1');
    expect(comments).toEqual(mockComments);

    vi.spyOn(clientModule, 'request').mockRejectedValueOnce(new Error('Comments error'));
    const fallbackComments = await tasksApi.getTaskComments('t2');
    expect(fallbackComments).toEqual([]);

    vi.spyOn(clientModule, 'request').mockResolvedValueOnce({ data: mockComments[0] });
    const newComment = await tasksApi.addComment('t1', '  Nice job  ');
    expect(newComment).toEqual(mockComments[0]);
    expect(clientModule.request).toHaveBeenCalledWith('/api/tasks/t1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Nice job' }),
    });

    vi.spyOn(clientModule, 'request').mockResolvedValueOnce(null);
    const deletedSuccess = await tasksApi.deleteComment('t1', 'c1');
    expect(deletedSuccess).toBe(true);

    vi.spyOn(clientModule, 'request').mockRejectedValueOnce(new Error('Failed to delete'));
    const deletedFail = await tasksApi.deleteComment('t1', 'c2');
    expect(deletedFail).toBe(false);
  });
});
