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

function authHeader(userId = new mongoose.Types.ObjectId().toString(), email = 'nishitha@nsbm.lk') {
  const token = jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn: '1h' });
  return {
    userId,
    token,
    header: { Authorization: `Bearer ${token}` },
  };
}

describe('Member 4: Backend Task API & Status Lifecycle Transition Suite', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  // ==========================================
  // 1. Task Security & Authentication Suite
  // ==========================================
  describe('Task Security & Authentication', () => {
    it('returns 401 with code: "NO_TOKEN" when Authorization header is missing', async () => {
      const res = await request(app).get('/api/tasks');

      expect(res.status).toBe(401);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NO_TOKEN');
      const message = res.body.message || res.body.error?.message;
      expect(message).toBe('Authentication required');
    });

    it('returns 401 with code: "BAD_TOKEN" when Authorization header contains invalid JWT', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(401);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('BAD_TOKEN');
    });

    it('denies access (403 Forbidden) when querying tasks for a board user is not a member of', async () => {
      const userA = authHeader(new mongoose.Types.ObjectId().toString(), 'userA@nsbm.lk');
      const userB = authHeader(new mongoose.Types.ObjectId().toString(), 'userB@nsbm.lk');

      const boardB = await Board.create({
        title: 'User B Secret Board',
        ownerId: userB.userId,
        members: [userB.userId],
      });

      const res = await request(app)
        .get(`/api/tasks?boardId=${boardB._id}`)
        .set(userA.header);

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });
  });

  // ==========================================
  // 2. Task Creation Suite
  // ==========================================
  describe('Task Creation (POST /api/tasks)', () => {
    it('returns 201 Created with expected fields (title, status: "todo", done: false, initial version: 1)', async () => {
      const user = authHeader();
      const board = await Board.create({
        title: 'Sprint Board 1',
        ownerId: user.userId,
        members: [user.userId],
      });

      const payload = {
        title: 'Implement Task API Endpoints',
        description: 'Create and verify REST task routes and controllers',
        boardId: board._id.toString(),
        status: 'todo',
        priority: 'high',
        assignee: 'Nishitha',
      };

      const res = await request(app)
        .post('/api/tasks')
        .set(user.header)
        .send(payload);

      expect(res.status).toBe(201);
      const task = res.body.data || res.body;
      expect(task.title).toBe('Implement Task API Endpoints');
      expect(task.status).toBe('todo');
      expect(task.done).toBe(false);
      expect(task.version).toBe(1);
      expect(task.boardId).toBe(board._id.toString());
      expect(task.assignee).toBe('Nishitha');
      expect(task.priority).toBe('high');
      expect(task.id || task._id).toBeDefined();
    });

    it('defaults status to "todo", priority to "medium", done to false, and version to 1 when omitted', async () => {
      const user = authHeader();
      const board = await Board.create({
        title: 'Sprint Board 2',
        ownerId: user.userId,
        members: [user.userId],
      });

      const payload = {
        title: 'Simple Minimum Task',
        boardId: board._id.toString(),
      };

      const res = await request(app)
        .post('/api/tasks')
        .set(user.header)
        .send(payload);

      expect(res.status).toBe(201);
      const task = res.body.data || res.body;
      expect(task.status).toBe('todo');
      expect(task.done).toBe(false);
      expect(task.version).toBe(1);
    });

    it('rejects task creation with 403 if target boardId is not accessible to the user', async () => {
      const userA = authHeader(new mongoose.Types.ObjectId().toString(), 'userA@nsbm.lk');
      const userB = authHeader(new mongoose.Types.ObjectId().toString(), 'userB@nsbm.lk');

      const boardB = await Board.create({
        title: 'User B Board',
        ownerId: userB.userId,
        members: [userB.userId],
      });

      const payload = {
        title: 'Unauthorized Task',
        boardId: boardB._id.toString(),
      };

      const res = await request(app)
        .post('/api/tasks')
        .set(userA.header)
        .send(payload);

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });
  });

  // ==========================================
  // 3. Task Query & Lifecycle Filtering Suite
  // ==========================================
  describe('Task Query & Lifecycle Filtering (GET /api/tasks)', () => {
    let user;
    let board;
    let otherBoard;

    beforeEach(async () => {
      user = authHeader();
      const otherUser = authHeader(new mongoose.Types.ObjectId().toString(), 'other@nsbm.lk');

      board = await Board.create({
        title: 'Engineering Sprint Board',
        ownerId: user.userId,
        members: [user.userId],
      });

      otherBoard = await Board.create({
        title: 'Marketing Board',
        ownerId: otherUser.userId,
        members: [otherUser.userId],
      });

      // Seed tasks across different statuses, assignees, and boards
      await Task.create([
        {
          title: 'Task 1: Setup Architecture',
          status: 'todo',
          priority: 'high',
          assignee: 'Nishitha',
          boardId: board._id.toString(),
          done: false,
          version: 1,
        },
        {
          title: 'Task 2: Build Database Layer',
          status: 'in-progress',
          priority: 'high',
          assignee: 'Nishitha',
          boardId: board._id.toString(),
          done: false,
          version: 1,
        },
        {
          title: 'Task 3: Setup Frontend Views',
          status: 'done',
          priority: 'normal',
          assignee: 'Shamika',
          boardId: board._id.toString(),
          done: true,
          version: 1,
        },
        {
          title: 'Task 4: Secret Campaign',
          status: 'todo',
          priority: 'low',
          assignee: 'Seniru',
          boardId: otherBoard._id.toString(),
          done: false,
          version: 1,
        },
      ]);
    });

    it('filters tasks by status: "todo"', async () => {
      const res = await request(app)
        .get('/api/tasks?status=todo')
        .set(user.header);

      expect(res.status).toBe(200);
      const list = res.body.data || res.body;
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(1);
      expect(list[0].status).toBe('todo');
      expect(list[0].title).toBe('Task 1: Setup Architecture');
    });

    it('filters tasks by status: "in-progress"', async () => {
      const res = await request(app)
        .get('/api/tasks?status=in-progress')
        .set(user.header);

      expect(res.status).toBe(200);
      const list = res.body.data || res.body;
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(1);
      expect(list[0].status).toBe('in-progress');
      expect(list[0].title).toBe('Task 2: Build Database Layer');
    });

    it('filters tasks by status: "done"', async () => {
      const res = await request(app)
        .get('/api/tasks?status=done')
        .set(user.header);

      expect(res.status).toBe(200);
      const list = res.body.data || res.body;
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(1);
      expect(list[0].status).toBe('done');
      expect(list[0].title).toBe('Task 3: Setup Frontend Views');
    });

    it('filters tasks by assignee (case-insensitive substring match)', async () => {
      const res = await request(app)
        .get('/api/tasks?assignee=Nishitha')
        .set(user.header);

      expect(res.status).toBe(200);
      const list = res.body.data || res.body;
      expect(list.length).toBe(2);
      list.forEach((t) => {
        expect(t.assignee.toLowerCase()).toContain('nishitha');
      });
    });

    it('scopes tasks to accessible boards and excludes tasks from unauthorized boards', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set(user.header);

      expect(res.status).toBe(200);
      const list = res.body.data || res.body;
      expect(list.length).toBe(3);
      const boardIds = list.map((t) => String(t.boardId));
      expect(boardIds).not.toContain(otherBoard._id.toString());
    });

    it('filters tasks scoped by specific boardId', async () => {
      const res = await request(app)
        .get(`/api/tasks?boardId=${board._id}`)
        .set(user.header);

      expect(res.status).toBe(200);
      const list = res.body.data || res.body;
      expect(list.length).toBe(3);
    });
  });

  // ==========================================
  // 4. Task Status Lifecycle Transitions Suite
  // ==========================================
  describe('Task Status Lifecycle Transitions (todo → in-progress → done)', () => {
    let user;
    let board;
    let task;

    beforeEach(async () => {
      user = authHeader();
      board = await Board.create({
        title: 'Workflow Board',
        ownerId: user.userId,
        members: [user.userId],
      });

      task = await Task.create({
        title: 'Status Transition Lifecycle Task',
        status: 'todo',
        boardId: board._id.toString(),
        done: false,
        version: 1,
      });
    });

    it('successfully executes lifecycle transition: todo → in-progress → done', async () => {
      const taskId = task._id.toString();

      // Step 1: Initial state is "todo"
      const getInitial = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set(user.header);

      expect(getInitial.status).toBe(200);
      const initialData = getInitial.body.data || getInitial.body;
      expect(initialData.status).toBe('todo');
      expect(initialData.done).toBe(false);
      expect(initialData.version).toBe(1);

      // Step 2: Transition from "todo" to "in-progress"
      const resStep1 = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set(user.header)
        .send({ status: 'in-progress' });

      expect(resStep1.status).toBe(200);
      const step1Data = resStep1.body.data || resStep1.body;
      expect(step1Data.status).toBe('in-progress');
      expect(step1Data.done).toBe(false);
      expect(step1Data.version).toBe(2);

      // Step 3: Transition from "in-progress" to "done"
      const resStep2 = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set(user.header)
        .send({ status: 'done' });

      expect(resStep2.status).toBe(200);
      const step2Data = resStep2.body.data || resStep2.body;
      expect(step2Data.status).toBe('done');
      expect(step2Data.done).toBe(true);
      expect(step2Data.version).toBe(3);

      // Step 4: Re-opening task from "done" back to "todo"
      const resStep3 = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set(user.header)
        .send({ status: 'todo' });

      expect(resStep3.status).toBe(200);
      const step3Data = resStep3.body.data || resStep3.body;
      expect(step3Data.status).toBe('todo');
      expect(step3Data.done).toBe(false);
      expect(step3Data.version).toBe(4);
    });

    it('updates status and metadata via generic PATCH /api/tasks/:id', async () => {
      const taskId = task._id.toString();

      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set(user.header)
        .send({
          title: 'Renamed Task Title',
          status: 'in-progress',
          priority: 'urgent',
        });

      expect(res.status).toBe(200);
      const updated = res.body.data || res.body;
      expect(updated.title).toBe('Renamed Task Title');
      expect(updated.status).toBe('in-progress');
      expect(updated.priority).toBe('urgent');
      expect(updated.version).toBe(2);
    });
  });

  // ==========================================
  // 5. Task Deletion & Validation Errors Suite
  // ==========================================
  describe('Task Deletion & Zod Validation Error Handling', () => {
    let user;
    let board;
    let task;

    beforeEach(async () => {
      user = authHeader();
      board = await Board.create({
        title: 'Validation Board',
        ownerId: user.userId,
        members: [user.userId],
      });

      task = await Task.create({
        title: 'Task To Delete Or Validate',
        status: 'todo',
        boardId: board._id.toString(),
        done: false,
        version: 1,
      });
    });

    it('deletes a task (DELETE /api/tasks/:id) returning 204 No Content', async () => {
      const taskId = task._id.toString();

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set(user.header);

      expect(res.status).toBe(204);

      // Verify task no longer exists
      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set(user.header);

      expect(getRes.status).toBe(404);
      const code = getRes.body.code || getRes.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('returns 400 VALIDATION_ERROR on invalid status transitions (Zod schema validation)', async () => {
      const taskId = task._id.toString();

      const res = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set(user.header)
        .send({ status: 'invalid_status_xyz' });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
      const details = res.body.details || res.body.error?.details;
      expect(Array.isArray(details)).toBe(true);
      expect(details.some((d) => d.field === 'status')).toBe(true);
    });

    it('returns 400 VALIDATION_ERROR when creating a task with title less than 3 characters', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set(user.header)
        .send({
          title: 'Hi', // min 3 required
          boardId: board._id.toString(),
        });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when creating a task without required boardId', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set(user.header)
        .send({
          title: 'Missing boardId Task',
        });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 VALIDATION_ERROR when task status query parameter is invalid', async () => {
      const res = await request(app)
        .get('/api/tasks?status=unsupported_status')
        .set(user.header);

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // 6. Task Permission Edge Conditions & Negative Tests
  // ==========================================
  describe('Task Permissions Edge Conditions & Negative Cases', () => {
    let authorizedUser;
    let unauthorizedUser;
    let board;
    let task;

    beforeEach(async () => {
      authorizedUser = authHeader(new mongoose.Types.ObjectId().toString(), 'owner@nsbm.lk');
      unauthorizedUser = authHeader(new mongoose.Types.ObjectId().toString(), 'stranger@nsbm.lk');

      board = await Board.create({
        title: 'Restricted Board',
        ownerId: authorizedUser.userId,
        members: [authorizedUser.userId],
      });

      task = await Task.create({
        title: 'Confidential Task',
        status: 'todo',
        boardId: board._id.toString(),
        done: false,
        version: 1,
      });
    });

    it('denies access (403 Forbidden) when user attempts to update a task without board/workspace permissions', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set(unauthorizedUser.header)
        .send({
          title: 'Hacked Title',
          priority: 'urgent',
        });

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('denies access (403 Forbidden) when user attempts to move task status without permissions', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${task._id}/status`)
        .set(unauthorizedUser.header)
        .send({
          status: 'in-progress',
        });

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('denies access (403 Forbidden) when user attempts to move a task to a target board they lack access to', async () => {
      const foreignOwner = authHeader(new mongoose.Types.ObjectId().toString(), 'foreign@nsbm.lk');
      const foreignBoard = await Board.create({
        title: 'Foreign Board',
        ownerId: foreignOwner.userId,
        members: [foreignOwner.userId],
      });

      const res = await request(app)
        .patch(`/api/tasks/${task._id}`)
        .set(authorizedUser.header)
        .send({
          boardId: foreignBoard._id.toString(),
        });

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('denies access (403 Forbidden) when unauthorized user attempts to delete a task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set(unauthorizedUser.header);

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('denies access (403 Forbidden) when unauthorized user attempts to fetch a single task', async () => {
      const res = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set(unauthorizedUser.header);

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('returns 404 NOT_FOUND when attempting to update a non-existent task', async () => {
      const fakeTaskId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/tasks/${fakeTaskId}`)
        .set(authorizedUser.header)
        .send({
          title: 'Ghost Task Update',
        });

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT_FOUND when attempting to move status on a non-existent task', async () => {
      const fakeTaskId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/tasks/${fakeTaskId}/status`)
        .set(authorizedUser.header)
        .send({
          status: 'done',
        });

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT_FOUND when attempting to delete a non-existent task', async () => {
      const fakeTaskId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/tasks/${fakeTaskId}`)
        .set(authorizedUser.header);

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT_FOUND when fetching a non-existent task', async () => {
      const fakeTaskId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/tasks/${fakeTaskId}`)
        .set(authorizedUser.header);

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });

    it('denies access (403 Forbidden) when unauthorized user attempts to comment on a task', async () => {
      const res = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set(unauthorizedUser.header)
        .send({
          content: 'Sneaky comment',
        });

      expect(res.status).toBe(403);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it("denies access (403 Forbidden) when user attempts to delete someone else's comment", async () => {
      const commentRes = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set(authorizedUser.header)
        .send({ content: 'Original author comment' });

      expect(commentRes.status).toBe(201);
      const commentId = commentRes.body.data.id;

      // Add stranger as board member so they can access the board, but not own the comment
      await Board.findByIdAndUpdate(board._id, {
        $push: { members: unauthorizedUser.userId },
      });

      const deleteRes = await request(app)
        .delete(`/api/tasks/${task._id}/comments/${commentId}`)
        .set(unauthorizedUser.header);

      expect(deleteRes.status).toBe(403);
      const code = deleteRes.body.code || deleteRes.body.error?.code;
      expect(code).toBe('FORBIDDEN');
    });

    it('returns 404 NOT_FOUND when adding comment to a non-existent task', async () => {
      const fakeTaskId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/tasks/${fakeTaskId}/comments`)
        .set(authorizedUser.header)
        .send({
          content: 'Orphan comment',
        });

      expect(res.status).toBe(404);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NOT_FOUND');
    });
  });
});
