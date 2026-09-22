import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config.js';
import { Workspace } from '../src/models/Workspace.js';
import { Board } from '../src/models/Board.js';
import { Task } from '../src/models/Task.js';
import { connectTestDb, clearTestDb, closeTestDb } from './setup/db.js';

function authHeader(userId = new mongoose.Types.ObjectId().toString(), email = 'user@collabboard.lk') {
  const token = jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn: '1h' });
  return {
    userId,
    token,
    header: { Authorization: `Bearer ${token}` },
  };
}

describe('Global Search API (GET /api/search)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/search?q=test');
    expect(res.status).toBe(401);
  });

  it('returns empty result when query is blank or missing', async () => {
    const user = authHeader();
    const res = await request(app)
      .get('/api/search')
      .set(user.header);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.workspaces).toEqual([]);
  });

  it('finds matching workspaces, boards, and tasks', async () => {
    const user = authHeader();

    // Create workspace
    const ws = await Workspace.create({
      name: 'Alpha Engineering Space',
      description: 'Main product engineering workspace',
      ownerId: user.userId,
    });

    // Create board
    const board = await Board.create({
      title: 'Sprint 42 Alpha Board',
      description: 'Alpha team sprint tasks',
      ownerId: user.userId,
    });
    ws.boards.push(board._id.toString());
    await ws.save();

    // Create task
    await Task.create({
      title: 'Fix Alpha Authentication bug',
      description: 'Investigate token expiration issue in Alpha',
      boardId: board._id.toString(),
      columnId: board.columns[0]._id.toString(),
      status: 'todo',
    });

    // 1. Search all with q=alpha
    const allRes = await request(app)
      .get('/api/search?q=alpha')
      .set(user.header);

    expect(allRes.status).toBe(200);
    expect(allRes.body.data.workspaces.length).toBe(1);
    expect(allRes.body.data.boards.length).toBe(1);
    expect(allRes.body.data.tasks.length).toBe(1);
    expect(allRes.body.data.total).toBe(3);

    // 2. Filter by type=workspaces
    const wsRes = await request(app)
      .get('/api/search?q=alpha&type=workspaces')
      .set(user.header);

    expect(wsRes.status).toBe(200);
    expect(wsRes.body.data.workspaces.length).toBe(1);
    expect(wsRes.body.data.boards.length).toBe(0);
    expect(wsRes.body.data.tasks.length).toBe(0);

    // 3. Filter by type=boards
    const boardRes = await request(app)
      .get('/api/search?q=alpha&type=boards')
      .set(user.header);

    expect(boardRes.status).toBe(200);
    expect(boardRes.body.data.boards.length).toBe(1);

    // 4. Filter by type=tasks
    const taskRes = await request(app)
      .get('/api/search?q=alpha&type=tasks')
      .set(user.header);

    expect(taskRes.status).toBe(200);
    expect(taskRes.body.data.tasks.length).toBe(1);
  });
});
