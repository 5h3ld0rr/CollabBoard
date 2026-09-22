import { workspaceRepo } from '../repos/workspaceRepo.js';
import { boardRepo } from '../repos/boardRepo.js';
import { userRepo } from '../repos/userRepo.js';
import { NotFoundError, ForbiddenError, AppError } from '../utils/AppError.js';

/**
 * Calculates live stats for a workspace (board IDs array, owned count, shared count, and total count)
 */
async function enrichWorkspace(workspace, userId, sharedBoardsCount = 0) {
  if (!workspace) return null;
  const boardIds = Array.isArray(workspace.boards) ? workspace.boards.map(String) : [];
  const ownedBoardCount = boardIds.length;
  const sharedCount = typeof sharedBoardsCount === 'number' ? sharedBoardsCount : 0;

  return {
    ...workspace,
    boards: boardIds,
    boardIds,
    ownedBoardCount,
    sharedBoardCount: sharedCount,
    boardCount: ownedBoardCount + sharedCount,
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
 * List all workspaces with dynamic stats, including shared boards for the user
 */
export async function listWorkspaces(userId) {
  const workspaces = await workspaceRepo.listByUserId(userId);
  if (!userId || workspaces.length === 0) {
    return Promise.all(workspaces.map((w) => enrichWorkspace(w, userId, 0)));
  }

  // Get user's shared boards (boards user is a member of, but not owner)
  const userBoards = await boardRepo.listByUserId(userId);
  const uid = String(userId);
  const sharedBoards = userBoards.filter((b) => b.ownerId && String(b.ownerId) !== uid);
  const sharedCount = sharedBoards.length;

  return Promise.all(
    workspaces.map((w, index) =>
      enrichWorkspace(w, userId, index === 0 ? sharedCount : 0)
    )
  );
}

/**
 * Get single workspace
 */
export async function getWorkspace(workspaceId, userId) {
  const workspace = await assertWorkspaceAccess(workspaceId, userId);
  let sharedCount = 0;
  if (userId) {
    const userBoards = await boardRepo.listByUserId(userId);
    const uid = String(userId);
    const sharedBoards = userBoards.filter((b) => b.ownerId && String(b.ownerId) !== uid);
    const userWorkspaces = await workspaceRepo.listByUserId(userId);
    if (userWorkspaces.length > 0 && String(userWorkspaces[0].id) === String(workspaceId)) {
      sharedCount = sharedBoards.length;
    }
  }
  return enrichWorkspace(workspace, userId, sharedCount);
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
