import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authApi from '../auth';
import * as clientModule from '../client';

vi.mock('../client');

describe('api/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register sends POST /api/auth/register', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com', name: 'Test' };
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: { user: mockUser } });

    const result = await authApi.register({ email: 'test@example.com', password: 'password123', name: 'Test' });
    expect(result).toEqual({ user: mockUser });
    expect(clientModule.request).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'Test' }),
    });
  });

  it('login sends POST /api/auth/login', async () => {
    const mockAuth = { token: 'jwt-token', user: { id: 'u1', email: 'test@example.com' } } as any;
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: mockAuth });

    const result = await authApi.login({ email: 'test@example.com', password: 'password123' });
    expect(result).toEqual(mockAuth);
    expect(clientModule.request).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
  });

  it('getMe fetches current user from /api/auth/me', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com' } as any;
    vi.spyOn(clientModule, 'request').mockResolvedValue({ data: { user: mockUser } });

    const result = await authApi.getMe();
    expect(result).toEqual(mockUser);
    expect(clientModule.request).toHaveBeenCalledWith('/api/auth/me');
  });

  it('logout calls /api/auth/logout and ignores failures', async () => {
    vi.spyOn(clientModule, 'request').mockResolvedValueOnce(null);
    await expect(authApi.logout()).resolves.toBeUndefined();
    expect(clientModule.request).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });

    vi.spyOn(clientModule, 'request').mockRejectedValueOnce(new Error('Network fail'));
    await expect(authApi.logout()).resolves.toBeUndefined();
  });
});
