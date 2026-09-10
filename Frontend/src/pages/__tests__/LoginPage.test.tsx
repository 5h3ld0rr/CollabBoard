import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { Login } from '../Login';
import { AuthProvider } from '../../context/AuthContext';
import { server } from '../../mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// Mock PouchDB functions used in AuthContext to prevent side-effects
vi.mock('../../db', () => ({
  getCachedUser: vi.fn().mockResolvedValue(null),
  saveCachedUser: vi.fn().mockResolvedValue(true),
  clearCachedUser: vi.fn().mockResolvedValue(true),
}));

describe('LoginPage Component', () => {
  it('renders required Email and Password inputs with correct HTML attributes', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/work email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toBeRequired();

    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toBeRequired();
  });

  it('handles successful login with MSW network mock', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/work email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText(/failed to log in/i)).not.toBeInTheDocument();
    });
  });
});
