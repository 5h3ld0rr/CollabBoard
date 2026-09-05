import { commentRepo } from '../repos/commentRepo.js';
import { taskRepo } from '../repos/taskRepo.js';
import { userRepo } from '../repos/userRepo.js';
import { assertBoardAccess } from './boardService.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';

function formatAuthor(user, authorId) {
  const name = user?.name || `User ${authorId}`;
  const email = user?.email || `user${authorId}@nsbm.lk`;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return {
    id: String(authorId),
    name,
    email,
    initials,
    color: 'bg-indigo-600',
  };
}

/**
 * List all comments for a task after verifying board access
 */
export async function listTaskComments(taskId, userId) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  await assertBoardAccess(task.boardId, userId);

  const rawComments = await commentRepo.listByTaskId(taskId);

  // Batch lookup authors to prevent N+1 queries
  const userIds = [...new Set(rawComments.map((c) => String(c.authorId)))];
  const userMap = new Map();
  await Promise.all(
    userIds.map(async (uid) => {
      const user = await userRepo.findById(uid);
      if (user) userMap.set(uid, user);
    })
  );

  return rawComments.map((c) => ({
    id: c.id,
    taskId: c.taskId,
    content: c.content,
    createdAt: c.createdAt,
    author: formatAuthor(userMap.get(String(c.authorId)), c.authorId),
  }));
}

/**
 * Add a comment to a task
 */
export async function addTaskComment(taskId, content, userId) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  await assertBoardAccess(task.boardId, userId);

  const user = await userRepo.findById(userId);

  const newComment = await commentRepo.create({
    taskId,
    authorId: userId,
    content,
  });

  return {
    id: newComment.id,
    taskId: newComment.taskId,
    content: newComment.content,
    createdAt: newComment.createdAt,
    author: formatAuthor(user, userId),
  };
}

/**
 * Delete a comment from a task (restricted to author or board owner)
 */
export async function deleteTaskComment(taskId, commentId, userId) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task');
  }

  await assertBoardAccess(task.boardId, userId);

  const comment = await commentRepo.findById(commentId);
  if (!comment || String(comment.taskId) !== String(taskId)) {
    throw new NotFoundError('Comment');
  }

  if (String(comment.authorId) !== String(userId)) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  await commentRepo.delete(commentId);
  return true;
}
