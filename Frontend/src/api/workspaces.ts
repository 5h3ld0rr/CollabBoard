import { request } from './client';
import type { Workspace } from '../types';

export interface WorkspaceListResponse {
  data: Workspace[];
}

export interface WorkspaceResponse {
  data: Workspace;
}

/**
 * Fetch all accessible workspaces for the current authenticated user
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  try {
    const res = await request<WorkspaceListResponse>('/api/workspaces');
    return res.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch single workspace by ID
 */
export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  try {
    const res = await request<WorkspaceResponse>(`/api/workspaces/${workspaceId}`);
    return res.data || null;
  } catch {
    return null;
  }
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  workspaceInput: Partial<Workspace> & { name: string }
): Promise<Workspace> {
  const res = await request<WorkspaceResponse>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify(workspaceInput),
  });
  return res.data;
}

/**
 * Update an existing workspace
 */
export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<Workspace>
): Promise<Workspace> {
  const res = await request<WorkspaceResponse>(`/api/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return res.data;
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<boolean> {
  await request(`/api/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });
  return true;
}
