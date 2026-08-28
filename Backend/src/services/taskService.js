import { taskRepo } from '../repos/taskRepo.js';
import { boardRepo } from '../repos/boardRepo.js';
import { assertBoardAccess } from './boardService.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';

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
 * Update an existing task ensuring user has access to current (and new) board
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

  return taskRepo.update(taskId, updates);
}

/**
 * Move task status within its lifecycle (todo -> doing -> done)
 */
export async function moveTaskStatus(taskId, newStatus, userId) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  await assertBoardAccess(task.boardId, userId);
  return taskRepo.update(taskId, { status: newStatus });
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
