import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request } from '../client';

describe('api/client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('performs a successful GET request and parses JSON', async () => {
    const mockData = { id: '1', name: 'Test' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockData,
    } as any);

    const result = await request('/test-path');
    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith('/test-path', expect.objectContaining({
      credentials: 'include',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
  });

  it('returns null on 204 No Content', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
    } as any);

    const result = await request('/no-content');
    expect(result).toBeNull();
  });

  it('dispatches auth:expired on 401 response and throws ApiError', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
    } as any);

    await expect(request('/protected')).rejects.toThrow('Unauthorized');
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:expired' }));
  });

  it('formats ApiError with detailed validation error array', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 400,
      ok: false,
      json: async () => ({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: [{ field: 'email', message: 'Email is invalid' }, { field: 'password', message: 'Too short' }],
        },
      }),
    } as any);

    await expect(request('/submit')).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Email is invalid. Too short',
    });
  });

  it('handles non-JSON error responses gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 500,
      statusText: 'Internal Server Error',
      ok: false,
      json: async () => { throw new Error('Not JSON'); },
    } as any);

    await expect(request('/error-500')).rejects.toThrow('HTTP Error 500: Internal Server Error');
  });
});
