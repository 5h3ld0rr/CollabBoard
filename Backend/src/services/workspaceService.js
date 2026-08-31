import { workspaceRepo } from '../repos/workspaceRepo.js';
import { boardRepo } from '../repos/boardRepo.js';
import { userRepo } from '../repos/userRepo.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';

/**
 * Calculates live stats for a workspace (board count, member count, user role, and populated member profiles)
 */
async function enrichWorkspace(workspace, userId) {
  if (!workspace) return null;
  const uid = String(userId);
  const isOwner = String(workspace.ownerId) === uid;
  const isAdmin = Array.isArray(workspace.admins) && workspace.admins.map(String).includes(uid);

  let role = 'Member';
  if (isOwner) {
    role = 'Owner';
  } else if (isAdmin) {
    role = 'Admin';
  }

  const rawMembers = Array.isArray(workspace.members) ? workspace.members : [];
  const populatedMembers = await Promise.all(
    rawMembers.map(async (m) => {
      if (m && typeof m === 'object' && 'name' in m) {
        return m;
      }
      const memberId = String(m);
      const user = await userRepo.findById(memberId);
      const isMemberOwner = String(workspace.ownerId) === memberId;
      const isMemberAdmin = Array.isArray(workspace.admins) && workspace.admins.map(String).includes(memberId);
      const memberRole = isMemberOwner ? 'Owner' : isMemberAdmin ? 'Admin' : 'Member';

      if (user) {
        const initials = (user.name || 'User')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const memberColors = {
          '1': 'bg-indigo-600',
          '2': 'bg-emerald-600',
          '3': 'bg-fuchsia-600',
          '4': 'bg-amber-600',
        };
        const color = memberColors[memberId] || 'bg-indigo-600';

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          initials,
          color,
          role: memberRole,
        };
      }

      return {
        id: memberId,
        name: `User ${memberId}`,
        email: `user${memberId}@nsbm.lk`,
        initials: `U${memberId}`,
        color: 'bg-indigo-600',
        role: memberRole,
      };
    })
  );

  const boardCount = await boardRepo.countByWorkspaceId(workspace.id, userId);
  const memberCount = populatedMembers.length;

  return {
    ...workspace,
    members: populatedMembers,
    boardCount,
    memberCount,
    role,
  };
}

/**
 * Asserts workspace exists and that requesting user is owner or member.
 */
export async function assertWorkspaceAccess(workspaceId, userId) {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundError('Workspace');
  }

  const uid = String(userId);
  const isOwner = String(workspace.ownerId) === uid;
  const isMember = Array.isArray(workspace.members) && workspace.members.map(String).includes(uid);

  if (!isOwner && !isMember) {
    throw new ForbiddenError('You do not have permission to access this workspace');
  }

  return workspace;
}

/**
 * List all workspaces for the requesting user with dynamic stats
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
  const created = await workspaceRepo.create({
    ...data,
    ownerId: userId,
  });
  return enrichWorkspace(created, userId);
}

/**
 * Update an existing workspace
 */
export async function updateWorkspace(workspaceId, updates, userId) {
  const workspace = await assertWorkspaceAccess(workspaceId, userId);
  const updated = await workspaceRepo.update(workspace.id, updates);
  return enrichWorkspace(updated, userId);
}

/**
 * Delete a workspace (restricted to workspace owner)
 */
export async function deleteWorkspace(workspaceId, userId) {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundError('Workspace');
  }

  if (String(workspace.ownerId) !== String(userId)) {
    throw new ForbiddenError('Only the workspace owner can delete this workspace');
  }

  await workspaceRepo.delete(workspaceId);
  return true;
}
