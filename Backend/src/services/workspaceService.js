import { workspaceRepo } from '../repos/workspaceRepo.js';
import { boardRepo } from '../repos/boardRepo.js';
import { userRepo } from '../repos/userRepo.js';
import { NotFoundError, AppError } from '../utils/AppError.js';

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
  if (userId) {
    const user = await userRepo.findById(userId);
    const plan = user?.subscriptionPlan || 'basic';
    if (plan === 'basic') {
      const existing = await workspaceRepo.listByUserId(userId);
      if (existing.length >= 3) {
        throw new AppError(
          'Workspace limit reached for Basic plan (maximum 3 workspaces). Upgrade to Pro for unlimited workspaces.',
          403,
          'PLAN_LIMIT_REACHED'
        );
      }
    }
  }

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
