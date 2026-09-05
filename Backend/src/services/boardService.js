import { boardRepo } from '../repos/boardRepo.js';
import { taskRepo } from '../repos/taskRepo.js';
import { userRepo } from '../repos/userRepo.js';
import { workspaceRepo } from '../repos/workspaceRepo.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';

/**
 * Enriches a board with dynamic, live computed task statistics and populated member profiles
 */
export async function enrichBoard(board) {
  if (!board) return null;
  const boardTasks = await taskRepo.findByBoardId(board.id);
  const totalTasks = boardTasks.length;
  const todoCount = boardTasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = boardTasks.filter((t) => t.status === 'in-progress' || t.status === 'doing').length;
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
      if (m && typeof m === 'object' && 'name' in m) {
        return m;
      }
      const memberId = String(m);
      const user = await userRepo.findById(memberId);
      const isOwner = String(board.ownerId) === memberId;
      const boardRole = isOwner ? 'Admin' : (idx === 0 ? 'Admin' : 'Editor');

      if (user) {
        const initials = (user.name || 'User')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const color = memberId === '1' ? 'bg-indigo-600' : memberId === '2' ? 'bg-emerald-600' : 'bg-fuchsia-600';

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

      return {
        id: memberId,
        name: `User ${memberId}`,
        email: `user${memberId}@nsbm.lk`,
        initials: `U${memberId}`,
        color: 'bg-indigo-600',
        boardRole,
        role: boardRole,
      };
    })
  );

  return {
    ...board,
    workspaceName,
    members: populatedMembers,
    stats: {
      totalTasks,
      todoCount,
      inProgressCount,
      doneCount,
    },
  };
}

/**
 * Asserts that a board exists and that the requesting user is either the owner or a member.
 * Throws NotFoundError (404) if board does not exist.
 * Throws ForbiddenError (403) if user lacks access.
 */
export async function assertBoardAccess(boardId, userId) {
  const board = await boardRepo.findById(boardId);
  if (!board) {
    throw new NotFoundError('Board');
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
export async function getBoard(boardId, userId) {
  return assertBoardAccess(boardId, userId);
}

/**
 * Create a new board owned by the requesting user
 */
export async function createBoard(boardData, userId) {
  const created = await boardRepo.create({
    ...boardData,
    ownerId: userId,
  });
  return enrichBoard(created);
}

/**
 * Update board details if user has access
 */
export async function updateBoard(boardId, updates, userId) {
  const board = await assertBoardAccess(boardId, userId);
  const updated = await boardRepo.update(board.id, updates);
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
export async function addBoardMember(boardId, targetUserId, userId) {
  const board = await assertBoardAccess(boardId, userId);
  const currentMembers = board.members || [];
  const updatedMembers = Array.from(new Set([...currentMembers.map(String), String(targetUserId)]));
  const updated = await boardRepo.update(board.id, { members: updatedMembers });
  return enrichBoard(updated);
}

/**
 * Remove a collaborator from a board (restricted to board owner)
 */
export async function removeBoardMember(boardId, targetUserId, userId) {
  const board = await boardRepo.findById(boardId);
  if (!board) throw new NotFoundError('Board');
  if (String(board.ownerId) !== String(userId)) {
    throw new ForbiddenError('Only the board owner can remove members');
  }
  const currentMembers = board.members || [];
  const updatedMembers = currentMembers.filter((m) => String(m) !== String(targetUserId));
  const updated = await boardRepo.update(board.id, { members: updatedMembers });
  return enrichBoard(updated);
}
