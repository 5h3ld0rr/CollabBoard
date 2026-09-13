import * as taskService from '../services/taskService.js';
import { emitTaskCreated, emitTaskUpdated, emitTaskDeleted } from '../socket/index.js';

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
  res.status(201).json({
    data: task,
  });
}

export async function update(req, res) {
  const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
  emitTaskUpdated(task.boardId, task, req.user.id);
  res.status(200).json({
    data: task,
  });
}

export async function moveStatus(req, res) {
  const task = await taskService.moveTaskStatus(req.params.id, req.body.status, req.user.id);
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
