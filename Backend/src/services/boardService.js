import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { boardRepo } from '../repos/boardRepo.js';
import { taskRepo } from '../repos/taskRepo.js';
import { userRepo } from '../repos/userRepo.js';
import { workspaceRepo } from '../repos/workspaceRepo.js';
import { NotFoundError, ForbiddenError, ValidationError, AppError } from '../utils/AppError.js';

/**
 * Enriches a board with dynamic, live computed task statistics and populated member profiles
 */
export async function enrichBoard(board) {
  if (!board) return null;
  const boardTasks = await taskRepo.findByBoardId(board.id);
  const totalTasks = boardTasks.length;
  const todoCount = boardTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = boardTasks.filter((t) => t.status === 'in-progress').length;
  const doneCount = boardTasks.filter((t) => t.status === 'done').length;

  let workspaceName = '';
  if (board.workspaceId) {
    const ws = await workspaceRepo.findById(board.workspaceId);
    if (ws) {
      workspaceName = ws.name;
    }
  }

  const rawMembers = Array.isArray(board.members) ? board.members : [];
  const populatedMembers = await Promise.all(
    rawMembers.map(async (m, idx) => {
      if (m && typeof m === 'object' && 'name' in m && m.name) {
        return m;
      }
      const memberId = String(typeof m === 'object' && m !== null ? (m.email || m.id) : m);
      let user = await userRepo.findById(memberId);
      if (!user && memberId.includes('@')) {
        user = await userRepo.findByEmail(memberId);
      }
      const safeId = memberId.replace(/\./g, '_dot_');
      const isOwner = String(board.ownerId) === memberId || (user && String(board.ownerId) === String(user.id));
      const storedRole = board.memberRoles?.[memberId] || board.memberRoles?.[safeId] || (user && (board.memberRoles?.[String(user.id)] || board.memberRoles?.[String(user.id).replace(/\./g, '_dot_')])) || (typeof m === 'object' && m !== null ? m.boardRole : null);
      const boardRole = isOwner ? 'Owner' : (storedRole || (idx === 0 ? 'Admin' : 'Editor'));

      if (user) {
        const parts = (user.name || 'User').trim().split(/\s+/).filter(Boolean);
        const initials = user.initials || (parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
        const color = user.color || 'from-indigo-600 to-violet-600';

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          initials,
          color,
          boardRole,
          role: boardRole,
        };
      }

      // If user is not yet in the DB (invited collaborator by email or custom ID)
      const name = memberId.includes('@') ? memberId.split('@')[0] : (typeof m === 'object' && m?.name ? m.name : 'Collaborator');
      const initials = name.slice(0, 2).toUpperCase();
      return {
        id: memberId,
        name,
        email: memberId.includes('@') ? memberId : (typeof m === 'object' && m?.email ? m.email : undefined),
        initials,
        color: 'from-indigo-600 to-violet-600',
        boardRole,
        role: boardRole,
      };
    })
  );

  // Deduplicate populated members by user ID and email
  const seenMemberIds = new Set();
  const uniqueMembers = [];
  for (const m of populatedMembers) {
    if (!m) continue;
    const uid = String(m.id);
    const uemail = m.email ? m.email.toLowerCase() : null;
    if (seenMemberIds.has(uid) || (uemail && seenMemberIds.has(uemail))) {
      continue;
    }
    seenMemberIds.add(uid);
    if (uemail) seenMemberIds.add(uemail);
    uniqueMembers.push(m);
  }

  return {
    ...board,
    workspaceName,
    members: uniqueMembers,
    stats: {
      totalTasks,
      todoCount,
      inProgressCount,
      doneCount,
    },
  };
}

/**
 * Verify a temporary view-only share token for a board
 */
export function verifyShareToken(token, expectedBoardId) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.type !== 'board_share_view') return null;
    if (String(payload.boardId) !== String(expectedBoardId)) return null;
    return payload;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ForbiddenError('This temporary share link has expired');
    }
    throw new ForbiddenError('Invalid share link');
  }
}

/**
 * Asserts that a board exists and that the requesting user is either the owner or a member,
 * or possesses a valid temporary view-only share token.
 * Throws NotFoundError (404) if board does not exist.
 * Throws ForbiddenError (403) if user lacks access.
 */
export async function assertBoardAccess(boardId, userId, shareToken = null) {
  const board = await boardRepo.findById(boardId);
  if (!board) {
    throw new NotFoundError('Board');
  }

  // If a temporary share token was supplied, verify it
  if (shareToken) {
    const validShare = verifyShareToken(shareToken, boardId);
    if (validShare) {
      if (board.shareRevokedAt) {
        const issuedAtMs = validShare.iatMs || (validShare.iat ? validShare.iat * 1000 : 0);
        const revokedAtMs = new Date(board.shareRevokedAt).getTime();
        if (issuedAtMs < revokedAtMs) {
          throw new ForbiddenError('This temporary share link has been revoked or reset');
        }
      }
      return enrichBoard(board);
    }
  }

  const uid = String(userId);
  const isOwner = String(board.ownerId) === uid;
  const isMember = Array.isArray(board.members) && board.members.map(String).includes(uid);

  if (!isOwner && !isMember) {
    throw new ForbiddenError('You do not have permission to access this board');
  }

  return enrichBoard(board);
}

/**
 * List all boards accessible to the requesting user with live dynamic stats
 */
export async function listBoards(userId) {
  const rawBoards = await boardRepo.listByUserId(userId);
  return Promise.all(rawBoards.map((b) => enrichBoard(b)));
}

/**
 * Get single board details after ownership/membership verification
 */
export async function getBoard(boardId, userId, shareToken = null) {
  return assertBoardAccess(boardId, userId, shareToken);
}

/**
 * Generate a cryptographically signed, temporary view-only share token for a board
 */
export async function generateBoardShareToken(boardId, expiresIn = '24h', userId) {
  const board = await assertBoardAccess(boardId, userId);

  const isNever = expiresIn === 'never';
  const allowedExp = { '1h': 3600, '24h': 86400, '7d': 604800 };
  const durationSeconds = isNever ? null : (allowedExp[expiresIn] || 86400);
  const expiresAt = isNever ? null : new Date(Date.now() + durationSeconds * 1000).toISOString();

  const signOptions = isNever ? {} : { expiresIn };
  const token = jwt.sign(
    {
      boardId: String(board.id),
      type: 'board_share_view',
      role: 'Viewer',
      canView: true,
      iatMs: Date.now(),
    },
    config.jwtSecret,
    signOptions
  );

  // Persist active share token on the board document
  await boardRepo.update(boardId, {
    activeShareToken: {
      token,
      expiresIn,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdAt: new Date(),
    },
  });

  return {
    token,
    expiresAt,
    expiresIn,
    boardId: board.id,
  };
}

/**
 * Get the currently active share token for a board if one exists and has not expired or been revoked
 */
export async function getActiveBoardShareToken(boardId, userId) {
  const board = await assertBoardAccess(boardId, userId);
  if (!board.activeShareToken || !board.activeShareToken.token) {
    return null;
  }

  const { token, expiresIn, expiresAt } = board.activeShareToken;

  // Check expiration if applicable
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    await boardRepo.update(boardId, { activeShareToken: null });
    return null;
  }

  // Check if revoked
  if (board.shareRevokedAt) {
    const validShare = verifyShareToken(token, boardId);
    const issuedAtMs = validShare?.iatMs || (validShare?.iat ? validShare.iat * 1000 : 0);
    const revokedAtMs = new Date(board.shareRevokedAt).getTime();
    if (issuedAtMs < revokedAtMs) {
      await boardRepo.update(boardId, { activeShareToken: null });
      return null;
    }
  }

  return {
    token,
    expiresIn,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    boardId: String(board.id),
  };
}

/**
 * Reset/revoke all existing share tokens for a board
 */
export async function resetBoardShareToken(boardId, userId) {
  await assertBoardAccess(boardId, userId);
  await boardRepo.update(boardId, {
    shareRevokedAt: new Date(),
    activeShareToken: null,
  });
  return true;
}

/**
 * Create a new board owned by the requesting user
 */
export async function createBoard(boardData, userId) {
  let targetWorkspaceId = boardData.workspaceId;
  if (!targetWorkspaceId) {
    const userWorkspaces = await workspaceRepo.listByUserId(userId);
    targetWorkspaceId = userWorkspaces[0]?.id || null;
  }

  if (userId) {
    const user = await userRepo.findById(userId);
    const plan = user?.subscriptionPlan || 'basic';
    if (plan === 'basic' && targetWorkspaceId) {
      const boardCount = await boardRepo.countByWorkspaceId(targetWorkspaceId, userId);
      if (boardCount >= 10) {
        throw new AppError(
          'Board limit reached for Basic plan (maximum 10 boards per workspace). Upgrade to Pro for unlimited boards.',
          403,
          'PLAN_LIMIT_REACHED'
        );
      }
    }
  }

  const created = await boardRepo.create({
    ...boardData,
    workspaceId: targetWorkspaceId,
    ownerId: userId,
  });
  return enrichBoard(created);
}

/**
 * Update board details if user has access
 */
export async function updateBoard(boardId, updates, userId) {
  const board = await assertBoardAccess(boardId, userId);
  const uid = String(userId);
  const isOwner = String(board.ownerId) === uid;

  const sanitizedUpdates = { ...updates };

  // Resolve any member email identifiers to their MongoDB user ID if registered
  if (Array.isArray(sanitizedUpdates.members)) {
    if (userId) {
      const user = await userRepo.findById(userId);
      const plan = user?.subscriptionPlan || 'basic';
      if (plan === 'basic' && sanitizedUpdates.members.length > 5) {
        throw new AppError(
          'Collaborator limit reached for Basic plan (maximum 5 collaborators per board). Upgrade to Pro for unlimited collaborators.',
          403,
          'PLAN_LIMIT_REACHED'
        );
      }
    }

    sanitizedUpdates.members = await Promise.all(
      sanitizedUpdates.members.map(async (m) => {
        const identifier = typeof m === 'object' && m !== null ? (m.id || m.email) : m;
        let resolvedId = String(identifier);
        if (resolvedId.includes('@')) {
          const existingUser = await userRepo.findByEmail(resolvedId);
          if (existingUser) {
            resolvedId = String(existingUser.id);
          }
        }
        if (typeof m === 'object' && m !== null) {
          return {
            ...m,
            id: resolvedId,
          };
        }
        return resolvedId;
      })
    );
  }

  // Resolve any member email identifiers to their MongoDB user ID if registered in memberRoles
  if (sanitizedUpdates.memberRoles && typeof sanitizedUpdates.memberRoles === 'object') {
    const resolvedRoles = {};
    for (const [k, v] of Object.entries(sanitizedUpdates.memberRoles)) {
      let resolvedKey = k;
      if (k.includes('@')) {
        const u = await userRepo.findByEmail(k);
        if (u) {
          resolvedKey = String(u.id);
        }
      }
      resolvedRoles[resolvedKey] = v;
    }
    sanitizedUpdates.memberRoles = resolvedRoles;
  }

  // Validate any role updates submitted in memberRoles or members array
  if (sanitizedUpdates.memberRoles || sanitizedUpdates.members) {
    const rolesMap = { ...(sanitizedUpdates.memberRoles || {}) };
    if (Array.isArray(sanitizedUpdates.members)) {
      sanitizedUpdates.members.forEach((m) => {
        if (typeof m === 'object' && m !== null && (m.id || m.email) && (m.boardRole || m.role)) {
          rolesMap[String(m.id || m.email)] = m.boardRole || m.role;
        }
      });
    }

    for (const [targetId, newRole] of Object.entries(rolesMap)) {
      const currentRole = String(targetId) === String(board.ownerId)
        ? 'Owner'
        : (board.memberRoles?.[targetId] || board.memberRoles?.[targetId.replace(/\./g, '_dot_')] || 'Editor');

      // 1. Prevent self role change!
      if (String(targetId) === uid && newRole !== currentRole) {
        throw new ForbiddenError('You cannot change your own role on this board');
      }

      // 2. Prevent changing the board owner's role!
      if (String(targetId) === String(board.ownerId) && newRole !== 'Owner') {
        throw new ForbiddenError('Cannot change the role of the board owner');
      }

      // 3. Only board owner or admin can change member roles
      if (newRole !== currentRole) {
        const requesterRole = isOwner ? 'Owner' : (board.memberRoles?.[uid] || 'Editor');
        if (requesterRole !== 'Owner' && requesterRole !== 'Admin') {
          throw new ForbiddenError('Only board owners and admins can modify member roles');
        }
      }
    }
  }

  const updated = await boardRepo.update(board.id, sanitizedUpdates);
  return enrichBoard(updated);
}

/**
 * Delete a board - strictly restricted to board owner
 */
export async function deleteBoard(boardId, userId) {
  const board = await boardRepo.findById(boardId);
  if (!board) {
    throw new NotFoundError('Board');
  }

  if (String(board.ownerId) !== String(userId)) {
    throw new ForbiddenError('Only the board owner is permitted to delete this board');
  }

  await boardRepo.delete(boardId);
  return true;
}

/**
 * Add a collaborator to a board
 */
export async function addBoardMember(boardId, targetUserId, role = 'Editor', userId) {
  const board = await assertBoardAccess(boardId, userId);
  let resolvedTargetId = String(targetUserId);

  if (resolvedTargetId.includes('@')) {
    const existingUser = await userRepo.findByEmail(resolvedTargetId);
    if (existingUser) {
      resolvedTargetId = String(existingUser.id);
    }
  }

  const currentMembers = board.members || [];
  const updatedMembers = Array.from(new Set([...currentMembers.map(String), resolvedTargetId]));
  const updatedRoles = {
    ...(board.memberRoles || {}),
    [resolvedTargetId]: role || 'Editor',
  };

  const updated = await boardRepo.update(board.id, {
    members: updatedMembers,
    memberRoles: updatedRoles,
  });
  return enrichBoard(updated);
}

/**
 * Remove a collaborator from a board (restricted to board owner)
 */
export async function removeBoardMember(boardId, targetUserId, userId) {
  const board = await boardRepo.findById(boardId);
  if (!board) throw new NotFoundError('Board');
  const targetId = String(targetUserId);

  if (String(board.ownerId) === targetId) {
    throw new ForbiddenError('The board owner cannot be removed from the board');
  }

  if (String(board.ownerId) !== String(userId)) {
    throw new ForbiddenError('Only the board owner can remove members');
  }
  const currentMembers = board.members || [];
  const updatedMembers = currentMembers.filter((m) => String(m) !== targetId);
  const updated = await boardRepo.update(board.id, { members: updatedMembers });
  return enrichBoard(updated);
}

/**
 * Update a specific member's role on a board
 */
export async function updateMemberRole(boardId, targetUserId, newRole, userId) {
  const board = await assertBoardAccess(boardId, userId);
  const uid = String(userId);
  let targetId = String(targetUserId);

  if (targetId.includes('@')) {
    const existingUser = await userRepo.findByEmail(targetId);
    if (existingUser) {
      targetId = String(existingUser.id);
    }
  }

  // 1. Prevent self role change
  if (targetId === uid) {
    throw new ForbiddenError('You cannot change your own role on this board');
  }

  // 2. Prevent changing board owner's role
  if (targetId === String(board.ownerId)) {
    throw new ForbiddenError('Cannot change the role of the board owner');
  }

  // 3. Only Owner or Admin can change member roles
  const requesterIsOwner = String(board.ownerId) === uid;
  const requesterRole = requesterIsOwner ? 'Owner' : (board.memberRoles?.[uid] || 'Editor');
  if (!requesterIsOwner && requesterRole !== 'Admin') {
    throw new ForbiddenError('Only board owners and admins can modify member roles');
  }

  // 4. Validate role
  if (!['Admin', 'Editor', 'Viewer'].includes(newRole)) {
    throw new ValidationError({ field: 'role', message: 'Invalid role. Role must be Admin, Editor, or Viewer' });
  }

  const updatedRoles = {
    ...(board.memberRoles || {}),
    [targetId]: newRole,
  };

  const updated = await boardRepo.update(board.id, { memberRoles: updatedRoles });
  return enrichBoard(updated);
}
