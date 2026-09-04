import { taskRepo } from '../repos/taskRepo.js';
import { boardRepo } from '../repos/boardRepo.js';
import { assertBoardAccess } from './boardService.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/AppError.js';

/**
 * Lists tasks with filtering, sorting, pagination, and board ownership authorization
 */
export async function listTasks(query = {}, userId) {
  const {
    status,
    assignee,
    priority,
    boardId,
    sort = '-createdAt',
    page = 1,
    limit = 20,
  } = query;

  // Retrieve all boards accessible to the user
  const userBoards = await boardRepo.listByUserId(userId);
  const accessibleBoardIds = new Set(userBoards.map((b) => String(b.id)));

  // If specific boardId is requested, enforce access check
  if (boardId) {
    await assertBoardAccess(boardId, userId);
  }

  let allTasks = await taskRepo.findAll();

  // Filter tasks to only those belonging to user's accessible boards
  let result = allTasks.filter((t) => {
    if (!accessibleBoardIds.has(String(t.boardId))) return false;
    if (boardId && String(t.boardId) !== String(boardId)) return false;
    return true;
  });

  // Apply query filters
  if (status) {
    result = result.filter((t) => t.status === status);
  }
  if (assignee) {
    const normAssignee = assignee.toLowerCase();
    result = result.filter((t) => t.assignee && t.assignee.toLowerCase().includes(normAssignee));
  }
  if (priority) {
    result = result.filter((t) => t.priority === priority);
  }

  // Sorting
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  result = [...result].sort((a, b) => {
    const valA = a[field] ?? '';
    const valB = b[field] ?? '';
    if (valA === valB) return 0;
    return (valA > valB ? 1 : -1) * (desc ? -1 : 1);
  });

  // Pagination
  const total = result.length;
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const start = (safePage - 1) * safeLimit;

  return {
    data: result.slice(start, start + safeLimit),
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
    },
  };
}

/**
 * Retrieve single task ensuring user has access to its board
 */
export async function getTask(taskId, userId) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  await assertBoardAccess(task.boardId, userId);
  return task;
}

/**
 * Create a new task within a board the user has access to
 */
export async function createTask(taskData, userId) {
  await assertBoardAccess(taskData.boardId, userId);
  return taskRepo.create(taskData);
}

/**
 * Update an existing task ensuring user has access to current (and new) board.
 * Enforces Optimistic Concurrency Control (OCC) using the version field.
 */
export async function updateTask(taskId, updates, userId) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  await assertBoardAccess(task.boardId, userId);

  if (updates.boardId && String(updates.boardId) !== String(task.boardId)) {
    await assertBoardAccess(updates.boardId, userId);
  }

  // If client provided a version in updates, check for version mismatch
  if (updates.version !== undefined && updates.version !== null) {
    if (Number(updates.version) !== Number(task.version)) {
      throw new ConflictError('Task version mismatch. The task was modified by another user.');
    }
  }

  const expectedVersion =
    updates.version !== undefined && updates.version !== null ? Number(updates.version) : task.version;

  const updated = await taskRepo.update(taskId, updates, expectedVersion);
  if (!updated) {
    throw new ConflictError('Task version mismatch. The task was modified by another user.');
  }

  return updated;
}

/**
 * Move task status within its lifecycle (todo -> doing -> done) with OCC verification
 */
export async function moveTaskStatus(taskId, newStatus, userId) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  await assertBoardAccess(task.boardId, userId);
  const updated = await taskRepo.update(taskId, { status: newStatus }, task.version);
  if (!updated) {
    throw new ConflictError('Task version mismatch. The task was modified by another user.');
  }
  return updated;
}

/**
 * Delete a task ensuring user has access to its parent board
 */
export async function deleteTask(taskId, userId) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  await assertBoardAccess(task.boardId, userId);
  await taskRepo.delete(taskId);
  return true;
}

/**
 * Returns board analytics computed in a single MongoDB aggregation round-trip.
 *
 * Answers:
 *  1. "How many tasks per assignee are overdue on this board?" (overduePerAssignee)
 *  2. Task distribution by status and priority (summary metrics)
 *
 * Authorization: Only board members/owners may fetch analytics.
 *
 * @param {string} boardId - The board to analyse
 * @param {string} userId  - The requesting user (for access control)
 * @returns {Promise<object>} Aggregated analytics data
 */
export async function getBoardAnalytics(boardId, userId) {
  // Reuse existing access guard — throws 403/404 if unauthorized
  await assertBoardAccess(boardId, userId);
  return taskRepo.getBoardAnalytics(boardId);
}

/**
 * Returns overdue tasks grouped by assignee for a specific board.
 * Answers: "How many tasks per assignee are overdue on this board?"
 *
 * @param {string} boardId - The board ID
 * @param {string} userId  - The requesting user
 * @returns {Promise<Array<object>>}
 */
export async function getOverdueTasksPerAssignee(boardId, userId) {
  await assertBoardAccess(boardId, userId);
  return taskRepo.getOverdueTasksPerAssignee(boardId);
}

/**
 * Returns summary metrics (counts by status and priority) for a specific board.
 *
 * @param {string} boardId - The board ID
 * @param {string} userId  - The requesting user
 * @returns {Promise<object>}
 */
export async function getBoardSummaryMetrics(boardId, userId) {
  await assertBoardAccess(boardId, userId);
  return taskRepo.getBoardSummaryMetrics(boardId);
}

