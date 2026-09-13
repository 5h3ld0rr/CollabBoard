import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as boardsApi from '../boards';
import * as clientModule from '../client';

vi.mock('../client');

describe('api/boards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getBoards returns board array on success', async () => {
    const mockBoards = [{ id: 'b1', title: 'Board 1' }];
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: mockBoards });

    const result = await boardsApi.getBoards();
    expect(result).toEqual(mockBoards);
    expect(clientModule.request).toHaveBeenCalledWith('/api/boards');
  });

  it('getBoards returns empty array on failure', async () => {
    vi.spyOn(clientModule, 'request').mockRejectedValue(new Error('Network error'));
    const result = await boardsApi.getBoards();
    expect(result).toEqual([]);
  });

  it('getBoardById returns board when found or null when error occurs', async () => {
    const mockBoard = { id: 'b1', title: 'Board 1' };
    vi.spyOn(clientModule, 'request').mockResolvedValueOnce({ data: mockBoard });

    const result = await boardsApi.getBoardById('b1');
    expect(result).toEqual(mockBoard);
    expect(clientModule.request).toHaveBeenCalledWith('/api/boards/b1');

    vi.spyOn(clientModule, 'request').mockRejectedValueOnce(new Error('Not found'));
    const notFound = await boardsApi.getBoardById('b99');
    expect(notFound).toBeNull();
  });

  it('createBoard sends POST request with payload and returns created board', async () => {
    const payload = { title: 'New Board', workspaceId: 'w1' } as any;
    const mockCreated = { id: 'b2', ...payload };
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: mockCreated });

    const result = await boardsApi.createBoard(payload);
    expect(result).toEqual(mockCreated);
    expect(clientModule.request).toHaveBeenCalledWith('/api/boards', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('updateBoard sends PATCH request with updates', async () => {
    const updates = { title: 'Updated' };
    const mockUpdated = { id: 'b1', title: 'Updated' };
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: mockUpdated });

    const result = await boardsApi.updateBoard('b1', updates);
    expect(result).toEqual(mockUpdated);
    expect(clientModule.request).toHaveBeenCalledWith('/api/boards/b1', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  });

  it('deleteBoard sends DELETE request and returns true', async () => {
    vi.spyOn(clientModule, 'request').mockResolvedValue(null);
    const result = await boardsApi.deleteBoard('b1');
    expect(result).toBe(true);
    expect(clientModule.request).toHaveBeenCalledWith('/api/boards/b1', { method: 'DELETE' });
  });

  it('addBoardMember and removeBoardMember send appropriate requests', async () => {
    const mockBoard = { id: 'b1', members: ['u1', 'u2'] };
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: mockBoard });

    const addRes = await boardsApi.addBoardMember('b1', 'u3');
    expect(addRes).toEqual(mockBoard);
    expect(clientModule.request).toHaveBeenCalledWith('/api/boards/b1/members', {
      method: 'POST',
      body: JSON.stringify({ userId: 'u3' }),
    });

    const removeRes = await boardsApi.removeBoardMember('b1', 'u2');
    expect(removeRes).toEqual(mockBoard);
    expect(clientModule.request).toHaveBeenCalledWith('/api/boards/b1/members/u2', {
      method: 'DELETE',
    });
  });
});
