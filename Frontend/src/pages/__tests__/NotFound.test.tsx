import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import NotFound from '../NotFound';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotFound Page', () => {
  it('renders 404 header, title, and action links', async () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/Houston, We Couldn't Find That Page/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');

    const user = userEvent.setup();
    const goBackBtn = screen.getByRole('button', { name: /go back/i });
    await user.click(goBackBtn);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
