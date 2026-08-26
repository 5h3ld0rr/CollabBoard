import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { AppError, NotFoundError } from '../utils/AppError.js';
import { userRepo, publicUser } from '../repos/userRepo.js';

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
  });

  const token = jwt.sign(
    { sub: newUser.id, email: newUser.email },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  return {
    token,
    user: publicUser(newUser),
  };
}

/**
 * Authenticate user credentials and return signed JWT token
 */
export async function login({ email, password }) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'BAD_CREDENTIALS');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid email or password', 401, 'BAD_CREDENTIALS');
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  return {
    token,
    user: publicUser(user),
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
