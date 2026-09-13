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
import { connectTestDb, clearTestDb, closeTestDb } from './setup/db.js';

function createAuth(userId = new mongoose.Types.ObjectId().toString(), email = 'ruwini@nsbm.lk') {
  const token = jwt.sign({ sub: userId, email }, config.jwtSecret, { expiresIn: '1h' });
  return {
    userId,
    token,
    header: { Authorization: `Bearer ${token}` },
  };
}

describe('Member 2: Ruwini Kanchana - Board Rooms, Live Presence & board:updated Suite', () => {
  let server;
  let serverPort;
  let socketUrl;

  beforeAll(async () => {
    await connectTestDb();

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
  // 1. Board Rooms & Real-Time Presence
  // ==========================================
  describe('Board Room Routing & Live Presence Updates', () => {
    it('emits presence:update when a user joins a board room via board:join', async () => {
      const user = createAuth();
      await User.create({ _id: user.userId, name: 'Ruwini', email: 'ruwini@nsbm.lk', passwordHash: 'hash123' });
      const ws = await Workspace.create({ name: 'Presence WS', ownerId: user.userId });
      const board = await Board.create({
        title: 'Presence Board',
        workspaceId: ws._id.toString(),
        ownerId: user.userId,
        members: [user.userId],
      });

      const clientSocket = Client(socketUrl, {
        auth: { token: user.token },
        transports: ['websocket'],
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));

      const presencePromise = new Promise((resolve) => {
        clientSocket.on('presence:update', (users) => resolve(users));
      });

      clientSocket.emit('board:join', board.id);
      const onlineUsers = await presencePromise;

      expect(Array.isArray(onlineUsers)).toBe(true);
      expect(onlineUsers).toContain(user.userId);

      clientSocket.close();
    });

    it('tracks multiple collaborators in presence:update when multiple users join same board', async () => {
      const user1 = createAuth(new mongoose.Types.ObjectId().toString(), 'user1@nsbm.lk');
      const user2 = createAuth(new mongoose.Types.ObjectId().toString(), 'user2@nsbm.lk');

      await User.create({ _id: user1.userId, name: 'User 1', email: 'user1@nsbm.lk', passwordHash: 'hash123' });
      await User.create({ _id: user2.userId, name: 'User 2', email: 'user2@nsbm.lk', passwordHash: 'hash123' });

      const ws = await Workspace.create({ name: 'Multi Presence WS', ownerId: user1.userId });
      const board = await Board.create({
        title: 'Multi Presence Board',
        workspaceId: ws._id.toString(),
        ownerId: user1.userId,
        members: [user1.userId, user2.userId],
      });

      const client1 = Client(socketUrl, { auth: { token: user1.token }, transports: ['websocket'] });
      const client2 = Client(socketUrl, { auth: { token: user2.token }, transports: ['websocket'] });

      await Promise.all([
        new Promise((resolve) => client1.on('connect', resolve)),
        new Promise((resolve) => client2.on('connect', resolve)),
      ]);

      client1.emit('board:join', board.id);

      const presenceForClient2 = new Promise((resolve) => {
        client2.on('presence:update', (users) => {
          if (users.includes(user1.userId) && users.includes(user2.userId)) {
            resolve(users);
          }
        });
      });

      client2.emit('board:join', board.id);
      const activeUsers = await presenceForClient2;

      expect(activeUsers).toContain(user1.userId);
      expect(activeUsers).toContain(user2.userId);

      client1.close();
      client2.close();
    });
  });

  // ==========================================
  // 2. board:updated Broadcasts
  // ==========================================
  describe('board:updated Event Broadcast on Metadata / Column Changes', () => {
    it('broadcasts board:updated with actorId, title, and columns when board is updated', async () => {
      const user = createAuth();
      await User.create({ _id: user.userId, name: 'Ruwini', email: 'ruwini@nsbm.lk', passwordHash: 'hash123' });
      const ws = await Workspace.create({ name: 'Board Update WS', ownerId: user.userId });
      const board = await Board.create({
        title: 'Original Board Title',
        workspaceId: ws._id.toString(),
        ownerId: user.userId,
        members: [user.userId],
        columns: [
          { title: 'To Do', position: 0 },
          { title: 'Done', position: 1 },
        ],
      });

      const clientSocket = Client(socketUrl, {
        auth: { token: user.token },
        transports: ['websocket'],
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));
      clientSocket.emit('board:join', board.id);

      const updatePromise = new Promise((resolve) => {
        clientSocket.on('board:updated', (payload) => resolve(payload));
      });

      const patchRes = await request(app)
        .patch(`/api/boards/${board.id}`)
        .set(user.header)
        .send({
          title: 'Renamed Live Board',
          description: 'Updated live description',
        });

      expect(patchRes.status).toBe(200);
      const payload = await updatePromise;

      expect(payload).toHaveProperty('board');
      expect(payload.board.title).toBe('Renamed Live Board');
      expect(payload.boardId).toBe(board.id);
      expect(payload.actorId).toBe(user.userId);
      expect(payload).toHaveProperty('columns');

      clientSocket.close();
    });
  });
});
