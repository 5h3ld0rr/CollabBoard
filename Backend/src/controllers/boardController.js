import * as boardService from '../services/boardService.js';
import { getBoardAnalytics } from '../services/taskService.js';

export async function list(req, res) {
  const boards = await boardService.listBoards(req.user.id);
  res.status(200).json({
    data: boards,
  });
}

export async function getOne(req, res) {
  const board = await boardService.getBoard(req.params.id, req.user.id);
  res.status(200).json({
    data: board,
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
  res.status(200).json({
    data: board,
  });
}

export async function remove(req, res) {
  await boardService.deleteBoard(req.params.id, req.user.id);
  res.status(204).end();
}

export async function addMember(req, res) {
  const board = await boardService.addBoardMember(req.params.id, req.body.userId, req.user.id);
  res.status(200).json({
    data: board,
  });
}

export async function removeMember(req, res) {
  const board = await boardService.removeBoardMember(req.params.id, req.params.memberId, req.user.id);
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
