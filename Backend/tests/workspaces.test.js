import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config.js';
import { Workspace } from '../src/models/Workspace.js';
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
});
