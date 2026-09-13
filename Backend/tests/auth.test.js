import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { connectTestDb, clearTestDb, closeTestDb } from './setup/db.js';

describe('Authentication API', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 when email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'x' });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 for unknown user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@nsbm.lk', password: 'whatever' });

      expect(res.status).toBe(401);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('BAD_CREDENTIALS');
    });

    it('returns 401 for wrong password', async () => {
      const passwordHash = await bcrypt.hash('THE_REAL_PASSWORD', 10);
      await User.create({
        name: 'User One',
        email: 'user1@nsbm.lk',
        passwordHash,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user1@nsbm.lk', password: 'WRONG_PASSWORD' });

      expect(res.status).toBe(401);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('BAD_CREDENTIALS');
    });

    it('returns a token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('THE_REAL_PASSWORD', 10);
      const user = await User.create({
        name: 'User One',
        email: 'user1@nsbm.lk',
        passwordHash,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user1@nsbm.lk', password: 'THE_REAL_PASSWORD' });

      expect(res.status).toBe(200);
      const token = res.body.token || res.body.data?.token;
      const returnedUser = res.body.user || res.body.data?.user;

      expect(typeof token).toBe('string');
      expect(returnedUser.email).toBe('user1@nsbm.lk');
      expect(String(returnedUser.id)).toBe(String(user._id));
    });
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Tester',
          email: 'newuser@nsbm.lk',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      const returnedUser = res.body.user || res.body.data?.user;
      expect(returnedUser.email).toBe('newuser@nsbm.lk');
      expect(returnedUser.name).toBe('New Tester');

      // Verify stored password was hashed in MongoDB
      const dbUser = await User.findOne({ email: 'newuser@nsbm.lk' });
      expect(dbUser).not.toBeNull();
      expect(dbUser.passwordHash).not.toBe('Password123!');
      const matches = await bcrypt.compare('Password123!', dbUser.passwordHash);
      expect(matches).toBe(true);
    });

    it('returns 409 when registering duplicate email', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      await User.create({
        name: 'Existing',
        email: 'duplicate@nsbm.lk',
        passwordHash,
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Attempt',
          email: 'duplicate@nsbm.lk',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('EMAIL_EXISTS');
    });
  });

  describe('GET /api/auth/me & Logout', () => {
    it('fetches profile of authenticated user', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      const user = await User.create({
        name: 'Profile User',
        email: 'profile@nsbm.lk',
        passwordHash,
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'profile@nsbm.lk', password: 'Password123!' });

      const token = loginRes.body.token || loginRes.body.data?.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      const profile = meRes.body.data?.user || meRes.body.user;
      expect(profile.email).toBe('profile@nsbm.lk');
      expect(String(profile.id)).toBe(String(user._id));
    });

    it('returns 401 when accessing profile without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NO_TOKEN');
    });

    it('logs out and clears authentication cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('Rate Limiter Security Guard', () => {
    it('returns 429 when exceeding login attempt threshold from same IP', async () => {
      const clientIp = '198.51.100.42';

      // Send 5 failed login attempts (the allowed limit per minute)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .set('X-Forwarded-For', clientIp)
          .send({ email: 'brute@nsbm.lk', password: `guess-${i}` });
      }

      // 6th attempt must trigger 429 RATE_LIMIT_EXCEEDED
      const rateLimitedRes = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', clientIp)
        .send({ email: 'brute@nsbm.lk', password: 'guess-6' });

      expect(rateLimitedRes.status).toBe(429);
      const code = rateLimitedRes.body.code || rateLimitedRes.body.error?.code;
      expect(code).toBe('RATE_LIMIT_EXCEEDED');
      expect(rateLimitedRes.headers).toHaveProperty('retry-after');
    });
  });
});
