import * as commentService from '../services/commentService.js';
import { taskRepo } from '../repos/taskRepo.js';
import { userRepo } from '../repos/userRepo.js';
import {
  emitCommentCreated,
  emitCommentDeleted,
  emitDirectNotification,
} from '../socket/index.js';

export async function list(req, res) {
  const { id: taskId } = req.params;
  const comments = await commentService.listTaskComments(taskId, req.user.id);
  res.status(200).json({ data: comments });
}

export async function create(req, res) {
  const { id: taskId } = req.params;
  const { content } = req.body;
  const comment = await commentService.addTaskComment(taskId, content, req.user.id);

  // Broadcast real-time comment event to board subscribers
  try {
    const task = await taskRepo.findById(taskId);
    if (task && task.boardId) {
      emitCommentCreated(task.boardId, taskId, comment, req.user.id);

      // If task has an assignee who is not the comment author, send direct notification
      let assigneeId = null;
      if (task.assignee) {
        if (typeof task.assignee === 'object') {
          assigneeId = task.assignee.id || task.assignee._id;
        } else {
          assigneeId = String(task.assignee);
        }
      }
      if (assigneeId && String(assigneeId) !== String(req.user.id)) {
        const actor = await userRepo.findById(req.user.id);
        const actorName = actor?.name || req.user.email?.split('@')[0] || 'A team member';
        emitDirectNotification(assigneeId, {
          title: 'New Comment',
          message: `${actorName} commented on "${task.title}"`,
          type: 'task_comment',
          linkUrl: `/tasks/${taskId}`,
          actor: { id: req.user.id, name: actorName },
          meta: { taskId, boardId: task.boardId, commentId: comment.id },
        });
      }
    }
  } catch (err) {
    console.warn('[commentController] Failed to emit comment socket event:', err);
  }

  res.status(201).json({ data: comment });
}

export async function remove(req, res) {
  const { id: taskId, commentId } = req.params;
  const task = await taskRepo.findById(taskId).catch(() => null);
  await commentService.deleteTaskComment(taskId, commentId, req.user.id);

  if (task && task.boardId) {
    try {
      emitCommentDeleted(task.boardId, taskId, commentId, req.user.id);
    } catch (err) {
      console.warn('[commentController] Failed to emit comment delete socket event:', err);
    }
  }

  res.status(204).send();
}

