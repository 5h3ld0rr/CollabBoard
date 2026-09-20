import * as boardService from '../services/boardService.js';
import { getBoardAnalytics } from '../services/taskService.js';
import { emitBoardUpdated, emitDirectNotification } from '../socket/index.js';
import { userRepo } from '../repos/userRepo.js';

export async function list(req, res) {
  const boards = await boardService.listBoards(req.user.id);
  res.status(200).json({
    data: boards,
  });
}

export async function getOne(req, res) {
  const board = await boardService.getBoard(req.params.id, req.user?.id, req.query?.shareToken);
  res.status(200).json({
    data: board,
  });
}

export async function generateShareToken(req, res) {
  const result = await boardService.generateBoardShareToken(
    req.params.id,
    req.body.expiresIn || '24h',
    req.user.id
  );
  res.status(200).json({
    data: result,
  });
}

export async function getActiveShareToken(req, res) {
  const result = await boardService.getActiveBoardShareToken(
    req.params.id,
    req.user.id
  );
  res.status(200).json({
    data: result,
  });
}

export async function create(req, res) {
  const board = await boardService.createBoard(req.body, req.user.id);
  res.status(201).json({
    data: board,
  });
}

export async function update(req, res) {
  const board = await boardService.updateBoard(req.params.id, req.body, req.user.id);
  emitBoardUpdated(board.id, board, req.user.id);
  res.status(200).json({
    data: board,
  });
}

export async function remove(req, res) {
  await boardService.deleteBoard(req.params.id, req.user.id);
  res.status(204).end();
}

export async function addMember(req, res) {
  const board = await boardService.addBoardMember(
    req.params.id,
    req.body.userId,
    req.body.role || 'Editor',
    req.user.id
  );
  emitBoardUpdated(board.id, board, req.user.id);

  try {
    let targetUserId = req.body.userId;
    if (targetUserId && String(targetUserId).includes('@')) {
      const u = await userRepo.findByEmail(targetUserId);
      if (u) targetUserId = String(u.id);
    }
    if (targetUserId && String(targetUserId) !== String(req.user.id)) {
      const actor = await userRepo.findById(req.user.id);
      const actorName = actor?.name || req.user.email?.split('@')[0] || 'A team member';
      emitDirectNotification(targetUserId, {
        title: 'Added to Board',
        message: `${actorName} added you to board "${board.title}" as ${req.body.role || 'Editor'}`,
        type: 'board_invite',
        linkUrl: `/boards/${board.id}`,
        actor: { id: req.user.id, name: actorName },
        meta: { boardId: board.id, role: req.body.role || 'Editor' },
      });
    }
  } catch (err) {
    console.warn('[boardController] Failed to emit direct notification on addMember:', err);
  }

  res.status(200).json({
    data: board,
  });
}

export async function removeMember(req, res) {
  const board = await boardService.removeBoardMember(req.params.id, req.params.memberId, req.user.id);
  emitBoardUpdated(board.id, board, req.user.id);
  res.status(200).json({
    data: board,
  });
}

export async function updateMemberRole(req, res) {
  const board = await boardService.updateMemberRole(
    req.params.id,
    req.params.memberId,
    req.body.role,
    req.user.id
  );
  emitBoardUpdated(board.id, board, req.user.id);
  res.status(200).json({
    data: board,
  });
}

/**
 * GET /api/boards/:id/analytics
 *
 * Returns board analytics computed in a SINGLE MongoDB aggregation round-trip
 * using a $facet pipeline (no application-level looping):
 *
 *  - overduePerAssignee: overdue task count per assignee with user details
 *  - byStatus:           task counts grouped by status
 *  - byPriority:         task counts grouped by priority
 *  - totalTasks:         total number of tasks on the board
 *  - totalOverdue:       total number of overdue tasks on the board
 *
 * Authorization: Board members and owners only.
 */
export async function getAnalytics(req, res) {
  const analytics = await getBoardAnalytics(req.params.id, req.user.id);
  res.status(200).json({
    data: analytics,
  });
}

export async function resetShareToken(req, res) {
  await boardService.resetBoardShareToken(req.params.id, req.user.id);
  res.status(200).json({
    data: {
      message: 'Board share link reset successfully. Previous links have been revoked.',
    },
  });
}

