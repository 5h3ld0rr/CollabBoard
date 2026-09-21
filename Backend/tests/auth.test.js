import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { config } from '../src/config.js';
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

    it('updates user profile including avatar', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      const user = await User.create({
        name: 'Avatar User',
        email: 'avatar@nsbm.lk',
        passwordHash,
      });

      const token = jwt.sign({ sub: user._id.toString(), email: user.email }, config.jwtSecret);

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Avatar User',
          avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        });

      expect(res.status).toBe(200);
      const updated = res.body.data?.user || res.body.user;
      expect(updated.name).toBe('Updated Avatar User');
      expect(updated.avatar).toContain('data:image/png;base64,');

      // Verify db document
      const dbUser = await User.findById(user._id);
      expect(dbUser.avatar).toContain('data:image/png;base64,');
    });
  });

  describe('PUT /api/auth/password', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .send({ currentPassword: 'OldPassword123!', newPassword: 'NewPassword123!' });

      expect(res.status).toBe(401);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('NO_TOKEN');
    });

    it('returns 400 when currentPassword is wrong', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
      const user = await User.create({
        name: 'Password Tester',
        email: 'pwdtester@nsbm.lk',
        passwordHash,
      });

      const token = jwt.sign({ sub: user._id.toString(), email: user.email }, config.jwtSecret);

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'WrongPassword!', newPassword: 'NewPassword123!' });

      expect(res.status).toBe(400);
      const code = res.body.code || res.body.error?.code;
      expect(code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('successfully updates password and enables login with new password', async () => {
      const passwordHash = await bcrypt.hash('OldPassword123!', 10);
      const user = await User.create({
        name: 'Password Tester 2',
        email: 'pwdtester2@nsbm.lk',
        passwordHash,
      });

      const token = jwt.sign({ sub: user._id.toString(), email: user.email }, config.jwtSecret);

      const updateRes = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'OldPassword123!', newPassword: 'NewBrandNewPassword123!' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.message || updateRes.body.data?.message).toBe('Password updated successfully');

      // Verify db updated directly
      const updatedUser = await User.findById(user._id);
      const isOldMatch = await bcrypt.compare('OldPassword123!', updatedUser.passwordHash);
      expect(isOldMatch).toBe(false);

      const isNewMatch = await bcrypt.compare('NewBrandNewPassword123!', updatedUser.passwordHash);
      expect(isNewMatch).toBe(true);
    });
  });

  describe('Active Device Sessions API', () => {
    it('creates a session on login and lists it via GET /api/auth/sessions', async () => {
      const passwordHash = await bcrypt.hash('THE_REAL_PASSWORD', 10);
      await User.create({
        name: 'Session User',
        email: 'sessionuser@nsbm.lk',
        passwordHash,
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.0.1.1')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')
        .send({ email: 'sessionuser@nsbm.lk', password: 'THE_REAL_PASSWORD' });

      expect(loginRes.status).toBe(200);
      const token = loginRes.body.token || loginRes.body.data?.token;

      const sessionsRes = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token}`);

      expect(sessionsRes.status).toBe(200);
      const sessions = sessionsRes.body.data;
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBe(1);
      expect(sessions[0].isCurrent).toBe(true);
      expect(sessions[0].device).toContain('Windows');
      expect(sessions[0].browser).toBe('Chrome');
      expect(sessions[0].iconType).toBe('laptop');
    });

    it('revokes a specific session and blocks subsequent requests with 401 SESSION_REVOKED', async () => {
      const passwordHash = await bcrypt.hash('THE_REAL_PASSWORD', 10);
      await User.create({
        name: 'Revoke User',
        email: 'revokeuser@nsbm.lk',
        passwordHash,
      });

      // Login first device
      const login1 = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.0.2.1')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
        .send({ email: 'revokeuser@nsbm.lk', password: 'THE_REAL_PASSWORD' });
      expect(login1.status).toBe(200);
      const token1 = login1.body.token || login1.body.data?.token;

      // Login second device
      const login2 = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.0.2.2')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        .send({ email: 'revokeuser@nsbm.lk', password: 'THE_REAL_PASSWORD' });
      expect(login2.status).toBe(200);
      const token2 = login2.body.token || login2.body.data?.token;

      // Device 2 lists sessions and finds device 1's sessionId
      const listRes = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token2}`);
      expect(listRes.status).toBe(200);
      const otherSession = listRes.body.data.find((s) => !s.isCurrent);
      expect(otherSession).toBeDefined();

      // Device 2 revokes device 1's session
      const revokeRes = await request(app)
        .delete(`/api/auth/sessions/${otherSession.id}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(revokeRes.status).toBe(200);

      // Device 1 tries to make an authenticated request -> must be rejected with 401 SESSION_REVOKED
      const checkRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`);
      expect(checkRes.status).toBe(401);
      const code = checkRes.body.code || checkRes.body.error?.code;
      expect(code).toBe('SESSION_REVOKED');
    });

    it('revokes all other sessions except current via POST /api/auth/sessions/revoke-others', async () => {
      const passwordHash = await bcrypt.hash('THE_REAL_PASSWORD', 10);
      await User.create({
        name: 'Multi Session User',
        email: 'multisession@nsbm.lk',
        passwordHash,
      });

      // Login 3 sessions
      const login1 = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.0.3.1')
        .send({ email: 'multisession@nsbm.lk', password: 'THE_REAL_PASSWORD' });
      expect(login1.status).toBe(200);
      const token1 = login1.body.token || login1.body.data?.token;

      const login2 = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.0.3.2')
        .send({ email: 'multisession@nsbm.lk', password: 'THE_REAL_PASSWORD' });
      expect(login2.status).toBe(200);
      const token2 = login2.body.token || login2.body.data?.token;

      const login3 = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.0.3.3')
        .send({ email: 'multisession@nsbm.lk', password: 'THE_REAL_PASSWORD' });
      expect(login3.status).toBe(200);
      const token3 = login3.body.token || login3.body.data?.token;

      // Current session is device 3 -> revoke others
      const revokeAllRes = await request(app)
        .post('/api/auth/sessions/revoke-others')
        .set('Authorization', `Bearer ${token3}`);
      expect(revokeAllRes.status).toBe(200);
      expect(revokeAllRes.body.revokedCount).toBe(2);

      // Device 1 and 2 should now be revoked
      const check1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`);
      expect(check1.status).toBe(401);
      expect(check1.body.code || check1.body.error?.code).toBe('SESSION_REVOKED');

      const check2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token2}`);
      expect(check2.status).toBe(401);
      expect(check2.body.code || check2.body.error?.code).toBe('SESSION_REVOKED');

      // Device 3 is still active
      const check3 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token3}`);
      expect(check3.status).toBe(200);
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
