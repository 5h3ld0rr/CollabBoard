import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BackButton from '../BackButton';
import Logo from '../Logo';
import AmbientBackground from '../AmbientBackground';
import { ProtectedRoute } from '../ProtectedRoute';
import { PublicRoute } from '../PublicRoute';
import { OfflineIndicator } from '../OfflineIndicator';
import * as authContextModule from '../../../context/AuthContext';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('common navigation and route components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BackButton & Logo & AmbientBackground', () => {
    it('renders BackButton with default and custom label and link', () => {
      render(
        <MemoryRouter>
          <BackButton />
        </MemoryRouter>
      );
      expect(screen.getByText('Back to Home')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/');

      render(
        <MemoryRouter>
          <BackButton to="/dashboard" label="Return" />
        </MemoryRouter>
      );
      expect(screen.getByText('Return')).toBeInTheDocument();
    });

    it('renders Logo with various sizes and text toggle', () => {
      const { rerender } = render(<Logo size="sm" showText={true} />);
      expect(screen.getByText('CollabBoard')).toBeInTheDocument();

      rerender(<Logo size="lg" showText={false} />);
      expect(screen.queryByText('CollabBoard')).not.toBeInTheDocument();
    });

    it('renders AmbientBackground with background layers', () => {
      const { container } = render(<AmbientBackground />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ProtectedRoute', () => {
    it('shows loading skeleton when auth is loading', () => {
      vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to /login when not authenticated', () => {
      vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders protected children when authenticated', () => {
      vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      } as any);

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('PublicRoute', () => {
    it('redirects to /dashboard if authenticated', () => {
      vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
        isAuthenticated: true,
      } as any);

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <div>Guest Login Form</div>
                </PublicRoute>
              }
            />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Guest Login Form')).not.toBeInTheDocument();
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    it('renders guest content if not authenticated', () => {
      vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
        isAuthenticated: false,
      } as any);

      render(
        <MemoryRouter>
          <PublicRoute>
            <div>Guest Login Form</div>
          </PublicRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Guest Login Form')).toBeInTheDocument();
    });
  });

  describe('OfflineIndicator', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows offline notification when offline event fires, and can be dismissed', () => {
      render(<OfflineIndicator />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(screen.getByText(/You are Offline/i)).toBeInTheDocument();

      const closeBtn = screen.getByLabelText(/dismiss notification/i);
      fireEvent.click(closeBtn);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows online notification and invokes onSync when online event fires', () => {
      const handleSync = vi.fn();
      render(<OfflineIndicator onSync={handleSync} />);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(screen.getByText(/Back Online/i)).toBeInTheDocument();
      expect(handleSync).toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
