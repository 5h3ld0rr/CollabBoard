import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as workspacesApi from '../workspaces';
import * as clientModule from '../client';

vi.mock('../client');

describe('api/workspaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getWorkspaces returns list or empty array on error', async () => {
    const list = [{ id: 'w1', name: 'Work 1' }];
    vi.spyOn(clientModule, 'request').mockResolvedValueOnce({ data: list });

    const result = await workspacesApi.getWorkspaces();
    expect(result).toEqual(list);
    expect(clientModule.request).toHaveBeenCalledWith('/api/workspaces');

    vi.spyOn(clientModule, 'request').mockRejectedValueOnce(new Error('Network error'));
    const emptyResult = await workspacesApi.getWorkspaces();
    expect(emptyResult).toEqual([]);
  });

  it('getWorkspaceById returns workspace or null on error', async () => {
    const ws = { id: 'w1', name: 'Work 1' };
    vi.spyOn(clientModule, 'request').mockResolvedValueOnce({ data: ws });

    const result = await workspacesApi.getWorkspaceById('w1');
    expect(result).toEqual(ws);

    vi.spyOn(clientModule, 'request').mockRejectedValueOnce(new Error('Not found'));
    const nullResult = await workspacesApi.getWorkspaceById('w99');
    expect(nullResult).toBeNull();
  });

  it('createWorkspace, updateWorkspace and deleteWorkspace send correct requests', async () => {
    const ws = { id: 'w1', name: 'Work 1' };
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: ws });

    const created = await workspacesApi.createWorkspace({ name: 'Work 1' });
    expect(created).toEqual(ws);
    expect(clientModule.request).toHaveBeenCalledWith('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name: 'Work 1' }),
    });

    const updated = await workspacesApi.updateWorkspace('w1', { name: 'Work Updated' });
    expect(updated).toEqual(ws);
    expect(clientModule.request).toHaveBeenCalledWith('/api/workspaces/w1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Work Updated' }),
    });

    vi.spyOn(clientModule, 'request').mockResolvedValueOnce(null);
    const deleted = await workspacesApi.deleteWorkspace('w1');
    expect(deleted).toBe(true);
    expect(clientModule.request).toHaveBeenCalledWith('/api/workspaces/w1', { method: 'DELETE' });
  });
});
