import { request } from './client';
import type { User } from '../types';

export interface AuthResponse {
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterInput {
  name?: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register a new user account
 */
export async function register(input: RegisterInput): Promise<{ user: User; token?: string }> {
  const res = await request<{ data: { user: User; token?: string } }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

/**
 * Log in with existing credentials
 */
export async function login(input: LoginInput): Promise<AuthResponse['data']> {
  const res = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

/**
 * Fetch current authenticated user from token
 */
export async function getMe(): Promise<User> {
  const res = await request<{ data: { user: User } }>('/api/auth/me');
  return res.data.user;
}

/**
 * Log out and clear server-side session cookie
 */
export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', {
      method: 'POST',
    });
  } catch {
    // Ignore errors on logout
  }
}
