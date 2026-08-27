import { boardRepo } from '../repos/boardRepo.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';

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

  return board;
}

/**
 * List all boards accessible to the requesting user
 */
export async function listBoards(userId) {
  return boardRepo.listByUserId(userId);
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
export async function createBoard({ title, description, members }, userId) {
  return boardRepo.create({
    title,
    description,
    ownerId: userId,
    members: members || [],
  });
}

/**
 * Update board details if user has access
 */
export async function updateBoard(boardId, updates, userId) {
  const board = await assertBoardAccess(boardId, userId);
  return boardRepo.update(board.id, updates);
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
