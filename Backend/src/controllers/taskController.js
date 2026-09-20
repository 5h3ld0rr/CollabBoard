import * as taskService from '../services/taskService.js';
import {
  emitTaskCreated,
  emitTaskUpdated,
  emitTaskDeleted,
  emitDirectNotification,
} from '../socket/index.js';
import { userRepo } from '../repos/userRepo.js';
import { User } from '../models/User.js';

/**
 * Resolves a raw assignee value (object with id/_id, user ID string, email, or name)
 * to a canonical user ID string.
 */
async function resolveAssigneeId(assigneeValue) {
  if (!assigneeValue) return null;
  if (typeof assigneeValue === 'object') {
    if (assigneeValue.id) return String(assigneeValue.id);
    if (assigneeValue._id) return String(assigneeValue._id);
  }
  if (typeof assigneeValue === 'string' && assigneeValue.trim()) {
    const trimmed = assigneeValue.trim();
    const user = await userRepo.findById(trimmed);
    if (user) return String(user.id || user._id);
    const byEmail = await userRepo.findByEmail(trimmed);
    if (byEmail) return String(byEmail.id || byEmail._id);
    const byName = await User.findOne({ name: trimmed }).lean();
    if (byName) return String(byName._id || byName.id);
    return trimmed;
  }
  return null;
}

export async function list(req, res) {
  const result = await taskService.listTasks(req.query, req.user.id);
  res.status(200).json(result);
}

export async function getOne(req, res) {
  const task = await taskService.getTask(req.params.id, req.user.id);
  res.status(200).json({
    data: task,
  });
}

export async function create(req, res) {
  const task = await taskService.createTask(req.body, req.user.id);
  emitTaskCreated(task.boardId, task, req.user.id);

  try {
    const rawAssignee = req.body.assigneeId || req.body.assignee || task.assignee;
    const targetUserId = await resolveAssigneeId(rawAssignee);
    if (targetUserId && String(targetUserId) !== String(req.user.id)) {
      const actor = await userRepo.findById(req.user.id);
      const actorName = actor?.name || req.user.email?.split('@')[0] || 'A team member';
      emitDirectNotification(targetUserId, {
        title: 'Task Assigned',
        message: `${actorName} assigned you to "${task.title}"`,
        type: 'task_assigned',
        linkUrl: `/boards/${task.boardId}`,
        actor: { id: req.user.id, name: actorName },
        meta: { taskId: task.id || task._id, boardId: task.boardId },
      });
    }
  } catch (err) {
    console.warn('[taskController] Failed to emit direct notification on create:', err);
  }

  res.status(201).json({
    data: task,
  });
}

export async function update(req, res) {
  const prevTask = await taskService.getTask(req.params.id, req.user.id).catch(() => null);
  const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
  emitTaskUpdated(task.boardId, task, req.user.id);

  try {
    if (req.body.assignee !== undefined || req.body.assigneeId !== undefined) {
      const rawAssignee = req.body.assigneeId || req.body.assignee;
      const targetUserId = await resolveAssigneeId(rawAssignee);
      const prevAssigneeId = prevTask ? await resolveAssigneeId(prevTask.assignee) : null;

      if (targetUserId && String(targetUserId) !== String(req.user.id) && targetUserId !== prevAssigneeId) {
        const actor = await userRepo.findById(req.user.id);
        const actorName = actor?.name || req.user.email?.split('@')[0] || 'A team member';
        emitDirectNotification(targetUserId, {
          title: 'Task Assigned',
          message: `${actorName} assigned you to "${task.title}"`,
          type: 'task_assigned',
          linkUrl: `/boards/${task.boardId}`,
          actor: { id: req.user.id, name: actorName },
          meta: { taskId: task.id || task._id, boardId: task.boardId },
        });
      }
    }
  } catch (err) {
    console.warn('[taskController] Failed to emit direct notification on update:', err);
  }

  res.status(200).json({
    data: task,
  });
}

export async function moveStatus(req, res) {
  const extraFields = {};
  if (req.body.columnId !== undefined) extraFields.columnId = req.body.columnId;
  if (req.body.position !== undefined) extraFields.position = req.body.position;
  if (req.body.order !== undefined) extraFields.order = req.body.order;

  const task = await taskService.moveTaskStatus(req.params.id, req.body.status, req.user.id, extraFields);
  emitTaskUpdated(task.boardId, task, req.user.id);
  res.status(200).json({
    data: task,
  });
}

export async function remove(req, res) {
  const deletedTask = await taskService.deleteTask(req.params.id, req.user.id);
  if (deletedTask) {
    emitTaskDeleted(deletedTask.boardId, req.params.id, req.user.id, deletedTask.version);
  }
  res.status(204).end();
}

export async function listByBoard(req, res) {
  const result = await taskService.listTasks(
    { ...req.query, boardId: req.params.id },
    req.user.id
  );
  res.status(200).json(result);
}
