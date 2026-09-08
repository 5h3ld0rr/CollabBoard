import { workspaceRepo } from '../repos/workspaceRepo.js';
import { boardRepo } from '../repos/boardRepo.js';
import { NotFoundError } from '../utils/AppError.js';

/**
 * Calculates live stats for a workspace (board count)
 */
async function enrichWorkspace(workspace, userId) {
  if (!workspace) return null;
  const boardCount = await boardRepo.countByWorkspaceId(workspace.id, userId);

  return {
    ...workspace,
    boardCount,
  };
}

/**
 * Asserts workspace exists.
 */
export async function assertWorkspaceAccess(workspaceId) {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundError('Workspace');
  }
  return workspace;
}

/**
 * List all workspaces with dynamic stats
 */
export async function listWorkspaces(userId) {
  const workspaces = await workspaceRepo.listByUserId(userId);
  return Promise.all(workspaces.map((w) => enrichWorkspace(w, userId)));
}

/**
 * Get single workspace
 */
export async function getWorkspace(workspaceId, userId) {
  const workspace = await assertWorkspaceAccess(workspaceId);
  return enrichWorkspace(workspace, userId);
}

/**
 * Create a new workspace
 */
export async function createWorkspace(data, userId) {
  const created = await workspaceRepo.create(data);
  return enrichWorkspace(created, userId);
}

/**
 * Update an existing workspace
 */
export async function updateWorkspace(workspaceId, updates, userId) {
  await assertWorkspaceAccess(workspaceId);
  const updated = await workspaceRepo.update(workspaceId, updates);
  return enrichWorkspace(updated, userId);
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(workspaceId) {
  await assertWorkspaceAccess(workspaceId);
  await workspaceRepo.delete(workspaceId);
  return true;
}
