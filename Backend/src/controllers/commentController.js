import * as commentService from '../services/commentService.js';

export async function list(req, res) {
  const { id: taskId } = req.params;
  const comments = await commentService.listTaskComments(taskId, req.user.id);
  res.status(200).json({ data: comments });
}

export async function create(req, res) {
  const { id: taskId } = req.params;
  const { content } = req.body;
  const comment = await commentService.addTaskComment(taskId, content, req.user.id);
  res.status(201).json({ data: comment });
}

export async function remove(req, res) {
  const { id: taskId, commentId } = req.params;
  await commentService.deleteTaskComment(taskId, commentId, req.user.id);
  res.status(204).send();
}
