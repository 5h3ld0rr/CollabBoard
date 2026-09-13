import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Navbar } from '../Navbar';
import * as authContextModule from '../../../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Navbar component', () => {
  const mockLogout = vi.fn();
  const mockUser = {
    id: 'u1',
    name: 'Alice Wonder',
    email: 'alice@example.com',
    initials: 'AW',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    } as any);
  });

  it('renders global search trigger and opens search overlay on click', async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const searchTrigger = screen.getByText(/search workspaces, boards, tasks/i);
    expect(searchTrigger).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(searchTrigger);

    const searchInput = await screen.findByPlaceholderText(/search across all workspaces/i);
    expect(searchInput).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 80));

    await user.type(searchInput, 'test query');
    expect(searchInput).toHaveValue('test query');
  });

  it('handles keyboard shortcuts (Ctrl+K to open, Escape to close)', async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });

    const searchInput = screen.getByPlaceholderText(/search across all workspaces/i);
    expect(searchInput).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(searchInput, '{Escape}');

    expect(
      screen.queryByPlaceholderText(/search across all workspaces/i)
    ).not.toBeInTheDocument();
  });

  it('updates online / offline badge state on window network events', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByTitle(/status: offline/i)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByTitle(/status: online/i)).toBeInTheDocument();
  });

  it('toggles notification toast and profile dropdown', async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const notifBtn = screen.getByRole('button', { name: /notifications/i });
    await user.click(notifBtn);
    expect(screen.getByText(/Clara moved card to In Progress/i)).toBeInTheDocument();

    const profileBtn = screen.getByRole('button', { name: /user profile menu/i });
    await user.click(profileBtn);
    expect(screen.getByText('Alice Wonder')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();

    const signOutBtn = screen.getByRole('button', { name: /sign out/i });
    await user.click(signOutBtn);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('hides search and workspace controls when variant="profile"', () => {
    render(
      <MemoryRouter>
        <Navbar variant="profile" />
      </MemoryRouter>
    );

    expect(screen.queryByText(/search workspaces, boards, tasks/i)).not.toBeInTheDocument();
  });

  it('renders "Log In" button and hides notifications and profile dropdown when user is unauthenticated', () => {
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      user: null,
      logout: mockLogout,
    } as any);

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /user profile menu/i })).not.toBeInTheDocument();
  });
});
