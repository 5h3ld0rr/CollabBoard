import { workspaceRepo } from '../repos/workspaceRepo.js';
import { boardRepo } from '../repos/boardRepo.js';
import { userRepo } from '../repos/userRepo.js';
import { NotFoundError, ForbiddenError, AppError } from '../utils/AppError.js';

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
 * Asserts workspace exists and that the user has permission to access it.
 */
export async function assertWorkspaceAccess(workspaceId, userId) {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundError('Workspace');
  }

  if (userId && workspace.ownerId) {
    const uid = String(userId);
    if (String(workspace.ownerId) !== uid) {
      throw new ForbiddenError('You do not have access to this workspace');
    }
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
  const workspace = await assertWorkspaceAccess(workspaceId, userId);
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

  const payload = {
    ...data,
    ownerId: userId ? String(userId) : null,
  };

  const created = await workspaceRepo.create(payload);
  return enrichWorkspace(created, userId);
}

/**
 * Update an existing workspace
 */
export async function updateWorkspace(workspaceId, updates, userId) {
  await assertWorkspaceAccess(workspaceId, userId);
  const updated = await workspaceRepo.update(workspaceId, updates);
  return enrichWorkspace(updated, userId);
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(workspaceId, userId) {
  const workspace = await assertWorkspaceAccess(workspaceId, userId);
  if (userId && workspace.ownerId && String(workspace.ownerId) !== String(userId)) {
    throw new ForbiddenError('Only the workspace owner can delete this workspace');
  }
  await workspaceRepo.delete(workspaceId);
  return true;
}
