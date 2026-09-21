import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { AppError, NotFoundError } from '../utils/AppError.js';
import { userRepo, publicUser } from '../repos/userRepo.js';
import { sessionRepo } from '../repos/sessionRepo.js';
import { workspaceRepo } from '../repos/workspaceRepo.js';
import { User, getRandomColor } from '../models/User.js';

/**
 * Register a new user with hashed password and return auth token
 */
export async function register({ email, password, name }) {
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await userRepo.create({
    email,
    passwordHash,
    name: name || 'User',
    color: getRandomColor(),
  });

  // Automatically provision a default workspace on the backend if none exists
  const existingWs = await workspaceRepo.findAll();
  if (existingWs.length === 0) {
    await workspaceRepo.create({
      name: 'My Workspace',
      description: '',
      color: 'from-indigo-600 to-violet-600',
    });
  }

  return {
    user: publicUser(newUser),
  };
}

/**
 * Authenticate user credentials, create an active session, and return signed JWT token
 */
export async function login({ email, password, rememberMe = false }, clientInfo = {}) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'BAD_CREDENTIALS');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid email or password', 401, 'BAD_CREDENTIALS');
  }

  const expiresIn = rememberMe ? '30d' : '1d';
  const sessionId = crypto.randomUUID();

  // Create active device session in database
  const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000);
  await sessionRepo.createSession({
    userId: String(user.id),
    sessionId,
    device: clientInfo.device || 'Desktop • Browser',
    browser: clientInfo.browser || 'Web Browser',
    os: clientInfo.os || 'Unknown OS',
    ip: clientInfo.ip || '127.0.0.1',
    location: clientInfo.location || 'Local Network',
    iconType: clientInfo.iconType || 'laptop',
    userAgent: clientInfo.userAgent || '',
    expiresAt,
  });

  const token = jwt.sign(
    { sub: user.id, email: user.email, sessionId },
    config.jwtSecret,
    { expiresIn }
  );

  return {
    token,
    user: publicUser(user),
    rememberMe,
  };
}

/**
 * Get currently authenticated user profile
 */
export async function getMe(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }
  return publicUser(user);
}

/**
 * Update authenticated user profile
 */
export async function updateProfile(userId, { name, email, color, subscriptionPlan, billingCycle }) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  const updates = {};
  if (name !== undefined) {
    updates.name = name.trim();
  }
  if (color !== undefined) {
    updates.color = color;
  }
  if (subscriptionPlan !== undefined) {
    updates.subscriptionPlan = subscriptionPlan;
  }
  if (billingCycle !== undefined) {
    updates.billingCycle = billingCycle;
  }
  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const existing = await userRepo.findByEmail(normalizedEmail);
      if (existing && String(existing.id) !== String(userId)) {
        throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
      }
      updates.email = normalizedEmail;
    }
  }

  const updated = await userRepo.update(userId, updates);
  return updated;
}

/**
 * Update authenticated user password
 */
export async function updatePassword(userId, { currentPassword, newPassword }) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid current password', 400, 'INVALID_CURRENT_PASSWORD');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await userRepo.updatePassword(userId, newHash);

  return {
    message: 'Password updated successfully',
  };
}

function formatLastActive(date) {
  if (!date) return 'Active Now';
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 2) return 'Active Now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

/**
 * Get all active device sessions for user
 */
export async function getActiveSessions(userId, currentSessionId, clientInfo = {}) {
  let sessions = await sessionRepo.findActiveSessionsByUserId(userId);

  // If user has a current session in token that doesn't exist in DB (e.g. legacy token), create/ensure it
  const hasCurrentInDb = currentSessionId && sessions.some((s) => s.sessionId === currentSessionId);
  if (currentSessionId && !hasCurrentInDb) {
    const newSession = await sessionRepo.createSession({
      userId: String(userId),
      sessionId: currentSessionId,
      device: clientInfo.device || 'Desktop • Browser',
      browser: clientInfo.browser || 'Web Browser',
      os: clientInfo.os || 'Unknown OS',
      ip: clientInfo.ip || '127.0.0.1',
      location: clientInfo.location || 'Local Network',
      iconType: clientInfo.iconType || 'laptop',
      userAgent: clientInfo.userAgent || '',
    });
    sessions = [newSession, ...sessions];
  } else if (!currentSessionId) {
    if (sessions.length === 0) {
      // If no session exists at all, synthesize current session so the user always sees their device
      const synId = crypto.randomUUID();
      const synSession = await sessionRepo.createSession({
        userId: String(userId),
        sessionId: synId,
        device: clientInfo.device || 'Desktop • Browser',
        browser: clientInfo.browser || 'Web Browser',
        os: clientInfo.os || 'Unknown OS',
        ip: clientInfo.ip || '127.0.0.1',
        location: clientInfo.location || 'Local Network',
        iconType: clientInfo.iconType || 'laptop',
        userAgent: clientInfo.userAgent || '',
      });
      sessions = [synSession];
      currentSessionId = synId;
    } else {
      // User has sessions in DB but token lacks sessionId (e.g. logged in prior to this feature):
      // Match by userAgent or select the most recently active session as current
      const matched =
        sessions.find((s) => s.userAgent && s.userAgent === clientInfo.userAgent) ||
        sessions[0];
      if (matched) {
        currentSessionId = matched.sessionId;
      }
    }
  }

  // Ensure currentSessionId is set if sessions exist
  if (!currentSessionId && sessions.length > 0) {
    currentSessionId = sessions[0].sessionId;
  }

  return sessions.map((s) => ({
    id: s.sessionId,
    device: (s.device || 'Desktop • Browser').replace('Windows 11 / 10', 'Windows'),
    browser: s.browser,
    ip: (s.ip === '::1' || s.ip === '::' || s.ip === '::ffff:127.0.0.1') ? '127.0.0.1' : s.ip,
    location: s.location,
    lastActive: (currentSessionId && s.sessionId === currentSessionId) ? 'Active Now' : formatLastActive(s.lastActive),
    isCurrent: Boolean(currentSessionId && s.sessionId === currentSessionId),
    iconType: s.iconType || 'laptop',
  }));
}

/**
 * Revoke a specific session
 */
export async function revokeSession(userId, sessionId) {
  const success = await sessionRepo.revokeSession(sessionId, userId);
  if (!success) {
    throw new NotFoundError('Session');
  }
  return { message: 'Session revoked successfully' };
}

/**
 * Revoke all other sessions except current
 */
export async function revokeOtherSessions(userId, currentSessionId) {
  const revokedCount = await sessionRepo.revokeOtherSessions(userId, currentSessionId);
  return {
    message: `Revoked ${revokedCount} other session${revokedCount === 1 ? '' : 's'} successfully`,
    revokedCount,
  };
}

