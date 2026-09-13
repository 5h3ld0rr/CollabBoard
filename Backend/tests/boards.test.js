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

    it('rejects self role change with 403 Forbidden', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Role WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Role Test Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [owner.userId],
      });

      const res = await request(app)
        .patch(`/api/boards/${board._id}/members/${owner.userId}`)
        .set(owner.header)
        .send({ role: 'Editor' });

      expect(res.status).toBe(403);
      expect(res.body.code || res.body.error?.code).toBe('FORBIDDEN');
    });

    it('rejects changing board owner role with 403 Forbidden', async () => {
      const owner = authHeader();
      const collaborator = authHeader();
      const ws = await Workspace.create({ name: 'Owner Role WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Owner Guard Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [collaborator.userId],
      });

      const res = await request(app)
        .patch(`/api/boards/${board._id}/members/${owner.userId}`)
        .set(collaborator.header)
        .send({ role: 'Viewer' });

      expect(res.status).toBe(403);
      expect(res.body.code || res.body.error?.code).toBe('FORBIDDEN');
    });

    it('rejects removing the board owner with 403 Forbidden', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Owner Removal WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Protected Board 1',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [owner.userId],
      });

      const res = await request(app)
        .delete(`/api/boards/${board._id}/members/${owner.userId}`)
        .set(owner.header);

      expect(res.status).toBe(403);
      expect(res.body.code || res.body.error?.code).toBe('FORBIDDEN');
    });

    it('allows board owner to update another member role', async () => {
      const owner = authHeader();
      const collaborator = authHeader();
      const ws = await Workspace.create({ name: 'Update Collab WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Collaborator Role Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [collaborator.userId],
      });

      const res = await request(app)
        .patch(`/api/boards/${board._id}/members/${collaborator.userId}`)
        .set(owner.header)
        .send({ role: 'Admin' });

      expect(res.status).toBe(200);
      const updated = res.body.data || res.body;
      const targetMember = updated.members.find((m) => String(m.id) === collaborator.userId);
      expect(targetMember.boardRole).toBe('Admin');
    });

    it('allows board owner/member to generate a temporary view share token', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Share WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Shareable Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      const res = await request(app)
        .post(`/api/boards/${board._id}/share-token`)
        .set(owner.header)
        .send({ expiresIn: '24h' });

      expect(res.status).toBe(200);
      const data = res.body.data || res.body;
      expect(data.token).toBeDefined();
      expect(data.expiresAt).toBeDefined();
      expect(data.expiresIn).toBe('24h');
    });

    it('allows unauthenticated guest to view board using a valid share token', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Guest WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Guest View Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      const tokenRes = await request(app)
        .post(`/api/boards/${board._id}/share-token`)
        .set(owner.header)
        .send({ expiresIn: '1h' });

      const shareToken = tokenRes.body.data.token;

      // Unauthenticated request with ?shareToken
      const res = await request(app)
        .get(`/api/boards/${board._id}?shareToken=${shareToken}`);

      expect(res.status).toBe(200);
      const retrieved = res.body.data || res.body;
      expect(retrieved.title).toBe('Guest View Board');
    });

    it('allows generating share token with never expire option', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Never WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Never Expiring Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      const tokenRes = await request(app)
        .post(`/api/boards/${board._id}/share-token`)
        .set(owner.header)
        .send({ expiresIn: 'never' });

      expect(tokenRes.status).toBe(200);
      expect(tokenRes.body.data.expiresIn).toBe('never');
      expect(tokenRes.body.data.expiresAt).toBeNull();
      const token = tokenRes.body.data.token;

      // Access board using never-expiring share token
      const res = await request(app).get(`/api/boards/${board._id}?shareToken=${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Never Expiring Board');
    });

    it('rejects guest access when share token is expired', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Expired WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Expired Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      // Generate already expired token (-10s)
      const expiredToken = jwt.sign(
        {
          boardId: String(board._id),
          type: 'board_share_view',
          role: 'Viewer',
        },
        config.jwtSecret,
        { expiresIn: '-10s' }
      );

      const res = await request(app)
        .get(`/api/boards/${board._id}?shareToken=${expiredToken}`);

      expect(res.status).toBe(403);
    });

    it('rejects guest access when share token is invalid or belongs to another board', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Tamper WS', ownerId: owner.userId });
      const boardA = await Board.create({
        title: 'Board A',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });
      const boardB = await Board.create({
        title: 'Board B',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      const tokenRes = await request(app)
        .post(`/api/boards/${boardA._id}/share-token`)
        .set(owner.header)
        .send({ expiresIn: '1h' });

      const tokenA = tokenRes.body.data.token;

      // Access boardB with token for boardA
      const res = await request(app)
        .get(`/api/boards/${boardB._id}?shareToken=${tokenA}`);

      expect(res.status).toBe(403);
    });

    it('rejects share token generation for non-members', async () => {
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
        .post(`/api/boards/${board._id}/share-token`)
        .set(stranger.header)
        .send({ expiresIn: '24h' });

      expect(res.status).toBe(403);
    });

    it('allows owner to reset share token and revokes previously generated links', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Reset WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Revokable Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      // 1. Generate token
      const tokenRes1 = await request(app)
        .post(`/api/boards/${board._id}/share-token`)
        .set(owner.header)
        .send({ expiresIn: '24h' });
      const token1 = tokenRes1.body.data.token;

      // 2. Token works initially
      const access1 = await request(app).get(`/api/boards/${board._id}?shareToken=${token1}`);
      expect(access1.status).toBe(200);

      // 3. Reset share token
      const resetRes = await request(app)
        .post(`/api/boards/${board._id}/share-token/reset`)
        .set(owner.header);
      expect(resetRes.status).toBe(200);

      // 4. Old token is now revoked and rejected with 403
      const accessOld = await request(app).get(`/api/boards/${board._id}?shareToken=${token1}`);
      expect(accessOld.status).toBe(403);

      // 5. Newly generated token works
      const tokenRes2 = await request(app)
        .post(`/api/boards/${board._id}/share-token`)
        .set(owner.header)
        .send({ expiresIn: '24h' });
      const token2 = tokenRes2.body.data.token;
      const accessNew = await request(app).get(`/api/boards/${board._id}?shareToken=${token2}`);
      expect(accessNew.status).toBe(200);
    });

    it('returns currently active share token via GET /api/boards/:id/share-token', async () => {
      const owner = authHeader();
      const ws = await Workspace.create({ name: 'Active Token WS', ownerId: owner.userId });
      const board = await Board.create({
        title: 'Board With Active Link',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [],
      });

      // Initially no active share token
      const initialRes = await request(app)
        .get(`/api/boards/${board._id}/share-token`)
        .set(owner.header);
      expect(initialRes.status).toBe(200);
      expect(initialRes.body.data).toBeNull();

      // Generate a share token
      const genRes = await request(app)
        .post(`/api/boards/${board._id}/share-token`)
        .set(owner.header)
        .send({ expiresIn: '7d' });
      expect(genRes.status).toBe(200);
      const generatedToken = genRes.body.data.token;

      // GET /api/boards/:id/share-token returns the active token
      const activeRes = await request(app)
        .get(`/api/boards/${board._id}/share-token`)
        .set(owner.header);
      expect(activeRes.status).toBe(200);
      expect(activeRes.body.data.token).toBe(generatedToken);
      expect(activeRes.body.data.expiresIn).toBe('7d');

      // Resetting revokes it and clears active token
      await request(app)
        .post(`/api/boards/${board._id}/share-token/reset`)
        .set(owner.header);

      const afterResetRes = await request(app)
        .get(`/api/boards/${board._id}/share-token`)
        .set(owner.header);
      expect(afterResetRes.status).toBe(200);
      expect(afterResetRes.body.data).toBeNull();
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

  describe('Board Role Assignments & Security Edge Conditions', () => {
    let owner;
    let stranger;
    let board;

    beforeEach(async () => {
      owner = authHeader(new mongoose.Types.ObjectId().toString(), 'board-owner@nsbm.lk');
      stranger = authHeader(new mongoose.Types.ObjectId().toString(), 'board-stranger@nsbm.lk');

      const ws = await Workspace.create({ name: 'Role Edge WS', ownerId: owner.userId });
      board = await Board.create({
        title: 'Role Test Board',
        workspaceId: ws._id.toString(),
        ownerId: owner.userId,
        members: [owner.userId],
      });
    });

    it('returns 400 VALIDATION_ERROR when adding member with an invalid role', async () => {
      const candidateId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/boards/${board._id}/members`)
        .set(owner.header)
        .send({
          userId: candidateId,
          role: 'InvalidRole_SuperAdmin',
        });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when adding member with missing or empty userId', async () => {
      const res = await request(app)
        .post(`/api/boards/${board._id}/members`)
        .set(owner.header)
        .send({
          role: 'Editor',
        });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });

    it('denies access (403 Forbidden) when non-member attempts to add a collaborator to a board', async () => {
      const candidateId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/boards/${board._id}/members`)
        .set(stranger.header)
        .send({
          userId: candidateId,
        });

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('denies access (403 Forbidden) when non-member attempts to update board metadata', async () => {
      const res = await request(app)
        .patch(`/api/boards/${board._id}`)
        .set(stranger.header)
        .send({
          title: 'Unauthorized Rename',
        });

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('returns 404 NOT_FOUND when attempting to update a non-existent board', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/boards/${fakeBoardId}`)
        .set(owner.header)
        .send({
          title: 'Ghost Board Update',
        });

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT_FOUND when attempting to add a collaborator to a non-existent board', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/boards/${fakeBoardId}/members`)
        .set(owner.header)
        .send({
          userId: new mongoose.Types.ObjectId().toString(),
        });

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT_FOUND when attempting to remove a collaborator from a non-existent board', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/boards/${fakeBoardId}/members/some-user-id`)
        .set(owner.header);

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('denies access (403 Forbidden) when unauthorized user requests board analytics', async () => {
      const res = await request(app)
        .get(`/api/boards/${board._id}/analytics`)
        .set(stranger.header);

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('returns 404 NOT_FOUND when requesting analytics for a non-existent board', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/boards/${fakeBoardId}/analytics`)
        .set(owner.header);

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT_FOUND when attempting to delete a non-existent board', async () => {
      const fakeBoardId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/boards/${fakeBoardId}`)
        .set(owner.header);

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });
  });
});
