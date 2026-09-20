import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { AppError, NotFoundError } from '../utils/AppError.js';
import { userRepo, publicUser } from '../repos/userRepo.js';
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
 * Authenticate user credentials and return signed JWT token
 */
export async function login({ email, password, rememberMe = false }) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'BAD_CREDENTIALS');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid email or password', 401, 'BAD_CREDENTIALS');
  }

  const expiresIn = rememberMe ? '30d' : '1d';
  const token = jwt.sign(
    { sub: user.id, email: user.email },
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
