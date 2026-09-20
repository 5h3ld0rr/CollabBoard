import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config.js';
import { Workspace } from '../src/models/Workspace.js';
import { Board } from '../src/models/Board.js';
import { connectTestDb, clearTestDb, closeTestDb } from './setup/db.js';

function authHeader(userId = new mongoose.Types.ObjectId().toString(), email = 'shamika@nsbm.lk') {
  const token = jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn: '1h' });
  return {
    userId,
    token,
    header: { Authorization: `Bearer ${token}` },
  };
}

describe('Workspace API', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('GET /api/workspaces', () => {
    it('returns 401 without an authorization token', async () => {
      const res = await request(app).get('/api/workspaces');
      expect(res.status).toBe(401);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NO_TOKEN');
    });

    it('auto-provisions "My Workspace" when no workspaces exist in database', async () => {
      const user = authHeader();
      const res = await request(app)
        .get('/api/workspaces')
        .set(user.header);

      expect(res.status).toBe(200);
      const workspaces = res.body.data || res.body;
      expect(Array.isArray(workspaces)).toBe(true);
      expect(workspaces.length).toBe(1);
      expect(workspaces[0].name).toBe('My Workspace');
      expect(workspaces[0]).toHaveProperty('boardCount');
    });

    it('lists all existing workspaces with board counts', async () => {
      const user = authHeader();
      await Workspace.create([
        { name: 'Engineering', description: 'Core team', color: 'from-blue-600 to-indigo-600' },
        { name: 'Design', description: 'Design system', color: 'from-pink-600 to-rose-600' },
      ]);

      const res = await request(app)
        .get('/api/workspaces')
        .set(user.header);

      expect(res.status).toBe(200);
      const workspaces = res.body.data || res.body;
      expect(workspaces.length).toBe(2);
      expect(workspaces.map((w) => w.name)).toEqual(
        expect.arrayContaining(['Engineering', 'Design'])
      );
    });

    it('does not return workspaces belonging to another user', async () => {
      const user1 = authHeader();
      const user2 = authHeader();

      await request(app)
        .post('/api/workspaces')
        .set(user1.header)
        .send({
          name: "User 1's Private Workspace",
          description: 'Secret projects',
        });

      const res = await request(app)
        .get('/api/workspaces')
        .set(user2.header);

      expect(res.status).toBe(200);
      const workspaces = res.body.data || res.body;
      const names = workspaces.map((w) => w.name);
      expect(names).not.toContain("User 1's Private Workspace");
    });
  });

  describe('POST /api/workspaces', () => {
    it('creates a new workspace on valid input', async () => {
      const user = authHeader();
      const res = await request(app)
        .post('/api/workspaces')
        .set(user.header)
        .send({
          name: 'Sprint Operations',
          description: 'Q3 deliverables workspace',
          color: 'from-emerald-600 to-teal-600',
        });

      expect(res.status).toBe(201);
      const created = res.body.data || res.body;
      expect(created.name).toBe('Sprint Operations');
      expect(created.color).toBe('from-emerald-600 to-teal-600');

      // Verify persisted in MongoDB
      const found = await Workspace.findById(created.id);
      expect(found).not.toBeNull();
      expect(found.name).toBe('Sprint Operations');
    });

    it('returns 400 when name is missing or invalid', async () => {
      const user = authHeader();
      const res = await request(app)
        .post('/api/workspaces')
        .set(user.header)
        .send({
          description: 'No name provided',
        });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/workspaces/:id & PATCH & DELETE', () => {
    it('retrieves single workspace by id', async () => {
      const user = authHeader();
      const ws = await Workspace.create({
        name: 'Single WS',
        description: 'Single workspace test',
      });

      const res = await request(app)
        .get(`/api/workspaces/${ws._id}`)
        .set(user.header);

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.name).toBe('Single WS');
      expect(data.id).toBe(ws._id.toString());
    });

    it('returns 404 for non-existent workspace id', async () => {
      const user = authHeader();
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/workspaces/${fakeId}`)
        .set(user.header);

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('updates workspace name and description', async () => {
      const user = authHeader();
      const ws = await Workspace.create({
        name: 'Old Name',
        description: 'Old Description',
      });

      const res = await request(app)
        .patch(`/api/workspaces/${ws._id}`)
        .set(user.header)
        .send({
          name: 'Renamed Workspace',
          color: 'from-amber-500 to-orange-600',
        });

      expect(res.status).toBe(200);
      const updated = res.body.data || res.body;
      expect(updated.name).toBe('Renamed Workspace');
      expect(updated.color).toBe('from-amber-500 to-orange-600');
    });

    it('deletes workspace and returns 204', async () => {
      const user = authHeader();
      const ws = await Workspace.create({
        name: 'To Delete',
      });

      const res = await request(app)
        .delete(`/api/workspaces/${ws._id}`)
        .set(user.header);

      expect(res.status).toBe(204);

      const check = await Workspace.findById(ws._id);
      expect(check).toBeNull();
    });
  });

  describe('Workspace Role Assignments & Edge Conditions', () => {
    it('ignores unsupported role updates', async () => {
      const user = authHeader();
      const ws = await Workspace.create({ name: 'WS Role Test' });

      const res = await request(app)
        .patch(`/api/workspaces/${ws._id}`)
        .set(user.header)
        .send({
          role: 'InvalidRole_SuperAdmin',
        });

      expect(res.status).toBe(200);
      const updated = res.body.data || res.body;
      expect(updated.id).toBe(ws._id.toString());
      expect(updated).not.toHaveProperty('role');
    });

    it('returns 400 VALIDATION_ERROR when updating workspace with a name shorter than 2 characters', async () => {
      const user = authHeader();
      const ws = await Workspace.create({ name: 'Valid WS' });

      const res = await request(app)
        .patch(`/api/workspaces/${ws._id}`)
        .set(user.header)
        .send({
          name: 'A',
        });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 NOT_FOUND when updating a non-existent workspace', async () => {
      const user = authHeader();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/workspaces/${fakeId}`)
        .set(user.header)
        .send({
          name: 'Ghost WS',
        });

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT_FOUND when deleting a non-existent workspace', async () => {
      const user = authHeader();
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/workspaces/${fakeId}`)
        .set(user.header);

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('contains boards and boardIds array in workspace responses and syncs on board creation/move', async () => {
      const user = authHeader();

      // Create two workspaces
      const ws1 = await Workspace.create({ name: 'Workspace Alpha', ownerId: user.userId });
      const ws2 = await Workspace.create({ name: 'Workspace Beta', ownerId: user.userId });

      // Create a board in Workspace Alpha
      const createBoardRes = await request(app)
        .post('/api/boards')
        .set(user.header)
        .send({
          title: 'Switchable Board',
          workspaceId: ws1._id.toString(),
        });

      expect(createBoardRes.status).toBe(201);
      const board = createBoardRes.body.data || createBoardRes.body;
      const boardId = board.id;

      // Verify Workspace Alpha includes this board ID
      const ws1Res = await request(app)
        .get(`/api/workspaces/${ws1._id}`)
        .set(user.header);

      expect(ws1Res.status).toBe(200);
      const ws1Data = ws1Res.body.data || ws1Res.body;
      expect(ws1Data.boards).toContain(boardId);
      expect(ws1Data.boardIds).toContain(boardId);

      // Now switch/move the board to Workspace Beta via PATCH /api/boards/:id
      const moveRes = await request(app)
        .patch(`/api/boards/${boardId}`)
        .set(user.header)
        .send({
          workspaceId: ws2._id.toString(),
        });

      expect(moveRes.status).toBe(200);
      const movedBoard = moveRes.body.data || moveRes.body;
      expect(movedBoard.workspaceId).toBe(ws2._id.toString());

      // Verify Workspace Beta now contains the board ID
      const ws2Res = await request(app)
        .get(`/api/workspaces/${ws2._id}`)
        .set(user.header);

      expect(ws2Res.status).toBe(200);
      const ws2Data = ws2Res.body.data || ws2Res.body;
      expect(ws2Data.boards).toContain(boardId);
      expect(ws2Data.boardIds).toContain(boardId);

      // Verify Workspace Alpha no longer contains the board ID
      const ws1AfterRes = await request(app)
        .get(`/api/workspaces/${ws1._id}`)
        .set(user.header);

      expect(ws1AfterRes.status).toBe(200);
      const ws1AfterData = ws1AfterRes.body.data || ws1AfterRes.body;
      expect(ws1AfterData.boards).not.toContain(boardId);
    });
  });
});
