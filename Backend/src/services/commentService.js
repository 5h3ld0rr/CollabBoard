import { commentRepo } from '../repos/commentRepo.js';
import { taskRepo } from '../repos/taskRepo.js';
import { userRepo } from '../repos/userRepo.js';
import { assertBoardAccess } from './boardService.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';

function formatAuthor(authorId, authorName, authorEmail) {
  const name = authorName || 'Team Member';
  const email = authorEmail || 'member@collabboard.io';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'TM';

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

  const comments = await commentRepo.listByTaskId(taskId);
  return comments.map((c) => ({
    id: c.id,
    taskId: c.taskId,
    content: c.content,
    createdAt: c.createdAt,
    author: formatAuthor(c.authorId, c.authorName, c.authorEmail),
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
  const authorName = user?.name || 'Team Member';
  const authorEmail = user?.email || 'member@collabboard.io';

  const newComment = await commentRepo.create({
    taskId,
    authorId: userId,
    authorName,
    authorEmail,
    content,
  });

  return {
    id: newComment.id,
    taskId: newComment.taskId,
    content: newComment.content,
    createdAt: newComment.createdAt,
    author: formatAuthor(userId, authorName, authorEmail),
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
