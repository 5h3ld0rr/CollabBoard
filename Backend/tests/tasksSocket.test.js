import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { config } from '../src/config.js';
import { initSocket, closeSocket } from '../src/socket/index.js';
import { Board } from '../src/models/Board.js';
import { Workspace } from '../src/models/Workspace.js';
import { User } from '../src/models/User.js';
import { Task } from '../src/models/Task.js';
import { connectTestDb, clearTestDb, closeTestDb } from './setup/db.js';

function createAuth(userId = new mongoose.Types.ObjectId().toString(), email = 'nishitha@nsbm.lk') {
  const token = jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn: '1h' });
  return {
    userId,
    token,
    header: { Authorization: `Bearer ${token}` },
  };
}

describe('Real-Time Task Sync & Socket.io Event Broadcast Suite', () => {
  let server;
  let serverPort;
  let socketUrl;

  beforeAll(async () => {
    await connectTestDb();

    // Start HTTP server with Socket.io attached for testing
    server = http.createServer(app);
    initSocket(server);

    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        socketUrl = `http://localhost:${serverPort}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await closeSocket();
    await new Promise((resolve) => server.close(resolve));
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  // ==========================================
  // 1. Socket Authentication & Room Handshake
  // ==========================================
  describe('Socket Authentication & Room Connection', () => {
    it('rejects socket connection when no authentication token is provided', (done) => {
      const clientSocket = Client(socketUrl, {
        transports: ['websocket'],
        reconnection: false,
      });

      clientSocket.on('connect_error', (err) => {
        expect(err.message).toMatch(/Authentication error/);
        clientSocket.close();
        done();
      });

      clientSocket.on('connect', () => {
        clientSocket.close();
        done(new Error('Socket should not have connected without token'));
      });
    });

    it('rejects socket connection when invalid JWT token is provided', (done) => {
      const clientSocket = Client(socketUrl, {
        auth: { token: 'invalid.token.here' },
        transports: ['websocket'],
        reconnection: false,
      });

      clientSocket.on('connect_error', (err) => {
        expect(err.message).toMatch(/Authentication error/);
        clientSocket.close();
        done();
      });

      clientSocket.on('connect', () => {
        clientSocket.close();
        done(new Error('Socket should not have connected with invalid token'));
      });
    });

    it('receives joined:board and left:board acknowledgments', async () => {
      const user = createAuth();
      const clientSocket = Client(socketUrl, {
        auth: { token: user.token },
        transports: ['websocket'],
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));

      const joinedPromise = new Promise((resolve) => {
        clientSocket.on('joined:board', (data) => resolve(data));
      });
      clientSocket.emit('join:board', 'board-ack-1');
      const joinedData = await joinedPromise;
      expect(joinedData).toEqual({ boardId: 'board-ack-1', room: 'board:board-ack-1' });

      const leftPromise = new Promise((resolve) => {
        clientSocket.on('left:board', (data) => resolve(data));
      });
      clientSocket.emit('leave:board', 'board-ack-1');
      const leftData = await leftPromise;
      expect(leftData).toEqual({ boardId: 'board-ack-1', room: 'board:board-ack-1' });

      clientSocket.close();
    });
  });

  // ==========================================
  // 2. Real-Time Task CRUD Events & OCC Payloads
  // ==========================================
  describe('Task Real-Time Broadcasts (task:created, task:updated, task:deleted)', () => {
    it('concurrently broadcasts events to multiple active clients in the same board room', async () => {
      const userA = createAuth();
      const userB = createAuth(new mongoose.Types.ObjectId().toString(), 'collab@nsbm.lk');

      await User.create({ _id: userA.userId, name: 'User A', email: 'userA@nsbm.lk', passwordHash: 'hash123' });
      await User.create({ _id: userB.userId, name: 'User B', email: 'userB@nsbm.lk', passwordHash: 'hash123' });

      const ws = await Workspace.create({ name: 'Multi-Client WS', ownerId: userA.userId });
      const board = await Board.create({
        title: 'Multi-Client Board',
        workspaceId: ws._id.toString(),
        ownerId: userA.userId,
        members: [userA.userId, userB.userId],
      });

      const clientA = Client(socketUrl, { auth: { token: userA.token }, transports: ['websocket'] });
      const clientB = Client(socketUrl, { auth: { token: userB.token }, transports: ['websocket'] });

      await Promise.all([
        new Promise((resolve) => clientA.on('connect', resolve)),
        new Promise((resolve) => clientB.on('connect', resolve)),
      ]);

      clientA.emit('join:board', board.id);
      clientB.emit('join:board', board.id);

      const promiseA = new Promise((resolve) => clientA.on('task:created', resolve));
      const promiseB = new Promise((resolve) => clientB.on('task:created', resolve));

      await request(app)
        .post('/api/tasks')
        .set(userA.header)
        .send({
          title: 'Broadcasted to multiple clients',
          boardId: board.id,
        });

      const [resA, resB] = await Promise.all([promiseA, promiseB]);

      expect(resA.task.title).toBe('Broadcasted to multiple clients');
      expect(resB.task.title).toBe('Broadcasted to multiple clients');
      expect(resA.actorId).toBe(userA.userId);
      expect(resB.actorId).toBe(userA.userId);

      clientA.close();
      clientB.close();
    });
    it('broadcasts task:created with actorId and version: 1 when task is created', async () => {
      const user = createAuth();
      await User.create({ _id: user.userId, name: 'Nishitha', email: 'nishitha@nsbm.lk', passwordHash: 'hash123' });
      const ws = await Workspace.create({ name: 'Sync WS', ownerId: user.userId });
      const board = await Board.create({
        title: 'Sync Board',
        workspaceId: ws._id.toString(),
        ownerId: user.userId,
        members: [user.userId],
      });

      const clientSocket = Client(socketUrl, {
        auth: { token: user.token },
        transports: ['websocket'],
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));
      clientSocket.emit('join:board', board.id);

      // Listen for task:created event
      const eventPromise = new Promise((resolve) => {
        clientSocket.on('task:created', (payload) => {
          resolve(payload);
        });
      });

      const createRes = await request(app)
        .post('/api/tasks')
        .set(user.header)
        .send({
          title: 'Implement OCC socket listener',
          boardId: board.id,
          priority: 'high',
        });

      expect(createRes.status).toBe(201);
      const payload = await eventPromise;

      expect(payload).toHaveProperty('task');
      expect(payload.task.title).toBe('Implement OCC socket listener');
      expect(payload.boardId).toBe(board.id);
      expect(payload.actorId).toBe(user.userId);
      expect(payload.version).toBe(1);
      expect(payload).toHaveProperty('timestamp');

      clientSocket.close();
    });

    it('broadcasts task:updated with actorId and incremented version on task update', async () => {
      const user = createAuth();
      await User.create({ _id: user.userId, name: 'Nishitha', email: 'nishitha@nsbm.lk', passwordHash: 'hash123' });
      const ws = await Workspace.create({ name: 'Sync WS', ownerId: user.userId });
      const board = await Board.create({
        title: 'Sync Board',
        workspaceId: ws._id.toString(),
        ownerId: user.userId,
        members: [user.userId],
      });

      const initialTask = await Task.create({
        title: 'Initial Task Name',
        boardId: board.id,
        version: 1,
      });

      const clientSocket = Client(socketUrl, {
        auth: { token: user.token },
        transports: ['websocket'],
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));
      clientSocket.emit('join:board', board.id);

      const updatePromise = new Promise((resolve) => {
        clientSocket.on('task:updated', (payload) => {
          resolve(payload);
        });
      });

      const updateRes = await request(app)
        .patch(`/api/tasks/${initialTask._id}`)
        .set(user.header)
        .send({
          title: 'Updated Task Name',
          priority: 'urgent',
          version: 1,
        });

      expect(updateRes.status).toBe(200);
      const payload = await updatePromise;

      expect(payload.task.title).toBe('Updated Task Name');
      expect(payload.boardId).toBe(board.id);
      expect(payload.actorId).toBe(user.userId);
      expect(payload.version).toBe(2);

      clientSocket.close();
    });

    it('broadcasts task:updated when status is transitioned via moveStatus', async () => {
      const user = createAuth();
      await User.create({ _id: user.userId, name: 'Nishitha', email: 'nishitha@nsbm.lk', passwordHash: 'hash123' });
      const ws = await Workspace.create({ name: 'Sync WS', ownerId: user.userId });
      const board = await Board.create({
        title: 'Sync Board',
        workspaceId: ws._id.toString(),
        ownerId: user.userId,
        members: [user.userId],
      });

      const task = await Task.create({
        title: 'Move Status Task',
        boardId: board.id,
        status: 'todo',
        version: 1,
      });

      const clientSocket = Client(socketUrl, {
        auth: { token: user.token },
        transports: ['websocket'],
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));
      clientSocket.emit('join:board', board.id);

      const statusPromise = new Promise((resolve) => {
        clientSocket.on('task:updated', (payload) => {
          resolve(payload);
        });
      });

      const moveRes = await request(app)
        .patch(`/api/tasks/${task._id}/status`)
        .set(user.header)
        .send({
          status: 'in-progress',
        });

      expect(moveRes.status).toBe(200);
      const payload = await statusPromise;

      expect(payload.task.status).toBe('in-progress');
      expect(payload.boardId).toBe(board.id);
      expect(payload.actorId).toBe(user.userId);
      expect(payload.version).toBe(2);

      clientSocket.close();
    });

    it('broadcasts task:deleted with taskId, boardId, actorId, and version on task deletion', async () => {
      const user = createAuth();
      await User.create({ _id: user.userId, name: 'Nishitha', email: 'nishitha@nsbm.lk', passwordHash: 'hash123' });
      const ws = await Workspace.create({ name: 'Sync WS', ownerId: user.userId });
      const board = await Board.create({
        title: 'Sync Board',
        workspaceId: ws._id.toString(),
        ownerId: user.userId,
        members: [user.userId],
      });

      const task = await Task.create({
        title: 'Task to Delete',
        boardId: board.id,
        version: 3,
      });

      const clientSocket = Client(socketUrl, {
        auth: { token: user.token },
        transports: ['websocket'],
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));
      clientSocket.emit('join:board', board.id);

      const deletePromise = new Promise((resolve) => {
        clientSocket.on('task:deleted', (payload) => {
          resolve(payload);
        });
      });

      const deleteRes = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set(user.header);

      expect(deleteRes.status).toBe(204);
      const payload = await deletePromise;

      expect(payload.taskId).toBe(task._id.toString());
      expect(payload.boardId).toBe(board.id);
      expect(payload.actorId).toBe(user.userId);
      expect(payload.version).toBe(3);

      clientSocket.close();
    });
  });
});
