import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { config } from '../src/config.js';
import { Board } from '../src/models/Board.js';
import { Task } from '../src/models/Task.js';
import { Workspace } from '../src/models/Workspace.js';
import { User } from '../src/models/User.js';
import { connectTestDb, clearTestDb, closeTestDb } from './setup/db.js';

function authHeader(userId = new mongoose.Types.ObjectId().toString(), email = 'tester@nsbm.lk') {
  const token = jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn: '1h' });
  return {
    userId,
    token,
    header: { Authorization: `Bearer ${token}` },
  };
}

describe('Optimistic Concurrency Control & 409 Conflict Handling', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  test('successfully updates a task and increments its version counter on matching version', async () => {
    const user = authHeader();

    // Create a workspace and board owned by the user
    const workspace = await Workspace.create({
      name: 'OCC Workspace',
      ownerId: user.userId,
    });

    const board = await Board.create({
      title: 'OCC Board',
      workspaceId: workspace._id.toString(),
      ownerId: user.userId,
    });

    // Create a task with initial version 0
    const task = await Task.create({
      title: 'Initial Task',
      boardId: board._id.toString(),
      status: 'todo',
      version: 0,
    });

    expect(task.version).toBe(0);

    // Client updates task supplying matching version 0
    const res = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set(user.header)
      .send({
        title: 'Updated Task Name',
        version: 0,
      });

    expect(res.status).toBe(200);
    const updatedData = res.body.data || res.body;
    expect(updatedData.title).toBe('Updated Task Name');
    expect(updatedData.version).toBe(1);

    // Verify persisted document in MongoDB
    const persisted = await Task.findById(task._id);
    expect(persisted.version).toBe(1);
    expect(persisted.title).toBe('Updated Task Name');
  });

  test('returns 409 Conflict when updating with a stale version', async () => {
    const user = authHeader();

    const workspace = await Workspace.create({
      name: 'Conflict Workspace',
      ownerId: user.userId,
    });

    const board = await Board.create({
      title: 'Conflict Board',
      workspaceId: workspace._id.toString(),
      ownerId: user.userId,
    });

    // 1. Task is created at version 0
    const task = await Task.create({
      title: 'Concurrent Task',
      boardId: board._id.toString(),
      status: 'todo',
      version: 0,
    });

    // 2. Client A updates task first -> advances version to 1
    const firstUpdateRes = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set(user.header)
      .send({
        title: 'Client A update',
        version: 0,
      });

    expect(firstUpdateRes.status).toBe(200);
    const firstData = firstUpdateRes.body.data || firstUpdateRes.body;
    expect(firstData.version).toBe(1);

    // 3. Client B (concurrent user) attempts update still holding stale version 0
    const conflictRes = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set(user.header)
      .send({
        title: 'Client B stale overwrite',
        version: 0,
      });

    // Assert 409 Conflict response
    expect(conflictRes.status).toBe(409);
    const errorCode = conflictRes.body.error?.code || conflictRes.body.code;
    expect(errorCode).toBe('CONFLICT');

    // 4. Assert that Client B did not overwrite the data in the database
    const persisted = await Task.findById(task._id);
    expect(persisted.title).toBe('Client A update');
    expect(persisted.version).toBe(1);
  });
});
