import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import * as authApi from '../../api/auth';
import * as db from '../../db';

vi.mock('../../api/auth');
vi.mock('../../db');

const TestConsumer: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout, updateUser } = useAuth();

  if (isLoading) return <div>Loading Auth...</div>;

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Logged In' : 'Logged Out'}</div>
      <div data-testid="user-name">{user?.name || 'No User'}</div>
      <div data-testid="user-initials">{user?.initials || ''}</div>
      <button
        onClick={() => login({ email: 'john@example.com', password: 'password123' })}
      >
        Trigger Login
      </button>
      <button onClick={() => logout()}>Trigger Logout</button>
      <button onClick={() => updateUser({ name: 'Jane Smith' })}>Update Name</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress React boundary console.error for expected throw
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  it('initializes from cached user and validates against backend', async () => {
    const cachedUser = { id: 'u1', name: 'Cached User', email: 'cached@example.com' } as any;
    const serverUser = { id: 'u1', name: 'Server User', email: 'cached@example.com' } as any;

    vi.spyOn(db, 'getCachedUser').mockResolvedValue(cachedUser);
    vi.spyOn(authApi, 'getMe').mockResolvedValue(serverUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Server User');
      expect(screen.getByTestId('user-initials')).toHaveTextContent('SU');
    });

    expect(db.saveCachedUser).toHaveBeenCalled();
  });

  it('clears auth state when getMe fails on initialization', async () => {
    vi.spyOn(db, 'getCachedUser').mockResolvedValue(null);
    vi.spyOn(authApi, 'getMe').mockRejectedValue(new Error('Session expired'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    });

    expect(db.clearCachedUser).toHaveBeenCalled();
  });

  it('handles login flow and updates state and cache', async () => {
    vi.spyOn(db, 'getCachedUser').mockResolvedValue(null);
    vi.spyOn(authApi, 'getMe').mockRejectedValue(new Error('Unauthorized'));

    const loggedInUser = { id: 'u2', name: 'John Doe', email: 'john@example.com' } as any;
    vi.spyOn(authApi, 'login').mockResolvedValue({ token: 'jwt-token', user: loggedInUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Trigger Login'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('user-initials')).toHaveTextContent('JD');
    });
    expect(db.saveCachedUser).toHaveBeenCalled();
  });

  it('handles logout flow and clears user session', async () => {
    const activeUser = { id: 'u1', name: 'Active User', email: 'active@example.com' } as any;
    vi.spyOn(db, 'getCachedUser').mockResolvedValue(activeUser);
    vi.spyOn(authApi, 'getMe').mockResolvedValue(activeUser);
    vi.spyOn(authApi, 'logout').mockResolvedValue();

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Trigger Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    });
    expect(db.clearCachedUser).toHaveBeenCalled();
  });

  it('handles updateUser and recalculates initials', async () => {
    const activeUser = { id: 'u1', name: 'Active User', email: 'active@example.com' } as any;
    vi.spyOn(db, 'getCachedUser').mockResolvedValue(activeUser);
    vi.spyOn(authApi, 'getMe').mockResolvedValue(activeUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Active User');
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Update Name'));

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Jane Smith');
      expect(screen.getByTestId('user-initials')).toHaveTextContent('JS');
    });
    expect(db.saveCachedUser).toHaveBeenCalled();
  });

  it('resets user when auth:expired window event is dispatched', async () => {
    const activeUser = { id: 'u1', name: 'Active User', email: 'active@example.com' } as any;
    vi.spyOn(db, 'getCachedUser').mockResolvedValue(activeUser);
    vi.spyOn(authApi, 'getMe').mockResolvedValue(activeUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    });

    act(() => {
      window.dispatchEvent(new Event('auth:expired'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    });
  });
});
