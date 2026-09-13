import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { config } from '../src/config.js';
import { initSocket, closeSocket } from '../src/socket/index.js';
import { connectTestDb, closeTestDb } from './setup/db.js';

function createAuth(userId = new mongoose.Types.ObjectId().toString(), email = 'shamudiamodya4@gmail.com', options = {}) {
  const token = jwt.sign({ sub: userId, email }, config.jwtSecret, {
    expiresIn: options.expiresIn ?? '1h',
  });
  return { userId, token, email };
}

describe('Member 4: shamu-4 - Socket Handshake Security & Authentication Suite', () => {
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

  it('rejects connection when no authentication token is provided with NO_TOKEN (Slide 11)', async () => {
    const clientSocket = Client(socketUrl, {
      transports: ['websocket'],
      reconnection: false,
      // No auth token provided
    });

    const error = await new Promise((resolve) => {
      clientSocket.on('connect_error', (err) => resolve(err));
      clientSocket.on('connect', () => resolve(null));
    });

    clientSocket.disconnect();
    expect(error).not.toBeNull();
    expect(error.message).toBe('NO_TOKEN');
  });

  it('rejects connection with invalid or forged token with BAD_TOKEN (Slide 11)', async () => {
    const clientSocket = Client(socketUrl, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: 'forged.invalid.token' },
    });

    const error = await new Promise((resolve) => {
      clientSocket.on('connect_error', (err) => resolve(err));
      clientSocket.on('connect', () => resolve(null));
    });

    clientSocket.disconnect();
    expect(error).not.toBeNull();
    expect(error.message).toBe('BAD_TOKEN');
  });

  it('rejects connection with expired JWT token with BAD_TOKEN (Slide 11)', async () => {
    // Generate token that expired 1 second ago
    const expiredToken = jwt.sign(
      { sub: 'usr-expired', email: 'expired@test.com' },
      config.jwtSecret,
      { expiresIn: '-1s' }
    );

    const clientSocket = Client(socketUrl, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: expiredToken },
    });

    const error = await new Promise((resolve) => {
      clientSocket.on('connect_error', (err) => resolve(err));
      clientSocket.on('connect', () => resolve(null));
    });

    clientSocket.disconnect();
    expect(error).not.toBeNull();
    expect(error.message).toBe('BAD_TOKEN');
  });

  it('successfully authenticates handshake when valid JWT token is provided', async () => {
    const auth = createAuth();
    const clientSocket = Client(socketUrl, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: auth.token },
    });

    const isConnected = await new Promise((resolve) => {
      clientSocket.on('connect', () => resolve(true));
      clientSocket.on('connect_error', () => resolve(false));
    });

    clientSocket.disconnect();
    expect(isConnected).toBe(true);
  });
});
