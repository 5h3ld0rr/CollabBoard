import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Register from '../Register';
import * as authContextModule from '../../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Register Page', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
      register: mockRegister,
      isAuthenticated: false,
    } as any);
  });

  it('renders all form input fields and terms checkbox', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('jane@company.com')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates password minimum length and matching passwords', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    const nameInput = screen.getByPlaceholderText('Jane Doe');
    const emailInput = screen.getByPlaceholderText('jane@company.com');
    const [pwdInput, confirmPwdInput] = screen.getAllByPlaceholderText('••••••••');
    const termsCheckbox = screen.getByRole('checkbox');
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'Jane Doe');
    await user.type(emailInput, 'jane@example.com');
    await user.type(pwdInput, '123'); // < 6 chars
    await user.type(confirmPwdInput, '123');
    await user.click(termsCheckbox);
    await user.click(submitBtn);

    expect(screen.getByText(/Password must be at least 6 characters long/i)).toBeInTheDocument();

    // Fix length but make them mismatch
    await user.clear(pwdInput);
    await user.type(pwdInput, 'password123');
    await user.clear(confirmPwdInput);
    await user.type(confirmPwdInput, 'different123');
    await user.click(submitBtn);

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it('submits registration successfully and redirects to /login with state', async () => {
    mockRegister.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('jane@company.com'), 'jane@example.com');
    const [pwdInput, confirmPwdInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(pwdInput, 'password123');
    await user.type(confirmPwdInput, 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({
        state: expect.objectContaining({
          registeredEmail: 'jane@example.com',
        }),
      }));
    });
  });

  it('displays API error banner when registration fails', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email is already in use'));

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
    await user.type(screen.getByPlaceholderText('jane@company.com'), 'jane@example.com');
    const [pwdInput, confirmPwdInput] = screen.getAllByPlaceholderText('••••••••');
    await user.type(pwdInput, 'password123');
    await user.type(confirmPwdInput, 'password123');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email is already in use/i)).toBeInTheDocument();
    });
  });
});
