import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config.js';
import { Board } from '../src/models/Board.js';
import { Workspace } from '../src/models/Workspace.js';
import { User } from '../src/models/User.js';
import { Task } from '../src/models/Task.js';
import { connectTestDb, clearTestDb, closeTestDb } from './setup/db.js';

function authHeader(userId = new mongoose.Types.ObjectId().toString(), email = 'board-owner@nsbm.lk') {
  const token = jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn: '1h' });
  return {
    userId,
    token,
    header: { Authorization: `Bearer ${token}` },
  };
}

describe('Board API & Analytics', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('GET /api/boards', () => {
    it('returns 401 when token is missing', async () => {
      const res = await request(app).get('/api/boards');
      expect(res.status).toBe(401);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NO_TOKEN');
    });

    it('lists boards accessible to the requesting user with live dynamic stats', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Dev WS', ownerId: owner.userId });

      const b1 = await Board.create({
        title: 'Board 1',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
      });

      // Add tasks to board 1 to verify live statistics calculation
      await Task.create([
        { title: 'Task A', boardId: b1._id.toString(), status: 'todo' },
        { title: 'Task B', boardId: b1._id.toString(), status: 'in-progress' },
        { title: 'Task C', boardId: b1._id.toString(), status: 'done' },
      ]);

      const res = await request(app)
        .get('/api/boards')
        .set(owner.header);

      expect(res.status).toBe(200);
      const boards = res.body.data || res.body;
      expect(boards.length).toBe(1);
      expect(boards[0].title).toBe('Board 1');
      expect(boards[0].stats).toEqual({
        totalTasks: 3,
        todoCount: 1,
        inProgressCount: 1,
        doneCount: 1,
      });
    });
  });

  describe('POST /api/boards', () => {
    it('creates a new board in workspace and returns 201', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Target WS', ownerId: owner.userId });

      const res = await request(app)
        .post('/api/boards')
        .set(owner.header)
        .send({
          title: 'Sprint 24 Board',
          description: 'Two-week sprint board',
          workspaceId: ws._id.toString(),
          tags: ['frontend', 'q3'],
        });

      expect(res.status).toBe(201);
      const created = res.body.data || res.body;
      expect(created.title).toBe('Sprint 24 Board');
      expect(created.workspaceId).toBe(ws._id.toString());
      expect(String(created.ownerId)).toBe(owner.userId);
    });

    it('returns 400 when title is missing', async () => {
      const owner = authHeader();
      const res = await request(app)
        .post('/api/boards')
        .set(owner.header)
        .send({
          description: 'Missing title',
        });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Board Authorization & Member Collaboration', () => {
    it('prevents non-member / non-owner from accessing board (403 Forbidden)', async () => {
      const owner = authHeader();
      const stranger = authHeader();

      const ws = await Workspace.create({ name: 'Private WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Confidential Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      const res = await request(app)
        .get(`/api/boards/${board._id}`)
        .set(stranger.header);

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('allows board owner to add a collaborator', async () => {
      const owner = authHeader();
      const collaborator = authHeader();

      await User.create({
        _id: collaborator.userId,
        name: 'Collaborator Person',
        email: 'collab@nsbm.lk',
        passwordHash: 'dummy',
      });

      const ws = await Workspace.create({ name: 'Collab WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Team Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      const res = await request(app)
        .post(`/api/boards/${board._id}/members`)
        .set(owner.header)
        .send({ userId: collaborator.userId });

      expect(res.status).toBe(200);
      const updated = res.body.data || res.body;
      const memberIds = updated.members.map((m) => String(m.id || m));
      expect(memberIds).toContain(collaborator.userId);

      // Verify the collaborator can now access the board
      const collabAccessRes = await request(app)
        .get(`/api/boards/${board._id}`)
        .set(collaborator.header);

      expect(collabAccessRes.status).toBe(200);
    });

    it('allows owner to remove collaborator', async () => {
      const owner = authHeader();
      const collaboratorId = new mongoose.Types.ObjectId().toString();

      const ws = await Workspace.create({ name: 'Removal WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Team Board 2',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [collaboratorId],
      });

      const res = await request(app)
        .delete(`/api/boards/${board._id}/members/${collaboratorId}`)
        .set(owner.header);

      expect(res.status).toBe(200);
      const updated = res.body.data || res.body;
      const memberIds = updated.members.map((m) => String(m.id || m));
      expect(memberIds).not.toContain(collaboratorId);
    });

    it('rejects board deletion by non-owner with 403 Forbidden', async () => {
      const owner = authHeader();
      const stranger = authHeader();

      const ws = await Workspace.create({ name: 'Delete Guard WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Protected Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [stranger.userId], // stranger is a member, but NOT owner
      });

      const res = await request(app)
        .delete(`/api/boards/${board._id}`)
        .set(stranger.header);

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('allows owner to delete board and returns 204', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Delete WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'To Be Deleted',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
      });

      const res = await request(app)
        .delete(`/api/boards/${board._id}`)
        .set(owner.header);

      expect(res.status).toBe(204);
      const check = await Board.findById(board._id);
      expect(check).toBeNull();
    });
  });

  describe('GET /api/boards/:id/analytics', () => {
    it('computes aggregation metrics in single roundtrip', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Analytics WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Analytics Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
      });

      // Populate tasks with priorities and statuses
      await Task.create([
        { title: 'Task 1', boardId: board._id.toString(), status: 'todo', priority: 'high' },
        { title: 'Task 2', boardId: board._id.toString(), status: 'in-progress', priority: 'medium' },
        { title: 'Task 3', boardId: board._id.toString(), status: 'done', priority: 'low' },
      ]);

      const res = await request(app)
        .get(`/api/boards/${board._id}/analytics`)
        .set(owner.header);

      expect(res.status).toBe(200);
      const analytics = res.body.data || res.body;
      expect(analytics).toHaveProperty('totalTasks');
      expect(analytics.totalTasks).toBe(3);
      expect(analytics).toHaveProperty('byStatus');
      expect(analytics).toHaveProperty('byPriority');
      expect(analytics).toHaveProperty('overduePerAssignee');
    });
  });
});
