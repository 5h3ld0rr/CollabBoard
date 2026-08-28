import * as workspaceService from '../services/workspaceService.js';

export async function list(req, res) {
  const workspaces = await workspaceService.listWorkspaces(req.user.id);
  res.status(200).json({
    data: workspaces,
  });
}

export async function getById(req, res) {
  const workspace = await workspaceService.getWorkspace(req.params.id, req.user.id);
  res.status(200).json({
    data: workspace,
  });
}

export async function create(req, res) {
  const workspace = await workspaceService.createWorkspace(req.body, req.user.id);
  res.status(201).json({
    data: workspace,
  });
}

export async function update(req, res) {
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.body, req.user.id);
  res.status(200).json({
    data: workspace,
  });
}

export async function remove(req, res) {
  await workspaceService.deleteWorkspace(req.params.id, req.user.id);
  res.status(204).send();
}
