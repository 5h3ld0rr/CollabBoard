import * as boardService from '../services/boardService.js';

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
