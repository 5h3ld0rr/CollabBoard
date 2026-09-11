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

  it('renders search input and handles search query updates', async () => {
    const handleSearch = vi.fn();
    render(
      <MemoryRouter>
        <Navbar searchQuery="test" onSearchChange={handleSearch} />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search boards/i);
    expect(searchInput).toHaveValue('test');

    const user = userEvent.setup();
    await user.type(searchInput, 's');
    expect(handleSearch).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts (Ctrl+K to focus, Escape to blur)', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search boards/i);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(document.activeElement).toBe(searchInput);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(document.activeElement).not.toBe(searchInput);
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

    expect(screen.queryByPlaceholderText(/search boards/i)).not.toBeInTheDocument();
  });
});
