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
}

/**
 * Register a new user account
 */
export async function register(input: RegisterInput): Promise<AuthResponse['data']> {
  const res = await request<AuthResponse>('/api/auth/register', {
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
