import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button';

describe('Button component', () => {
  it('renders button with text and triggers click event', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state properly and prevents clicks', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled Btn</Button>);

    const btn = screen.getByRole('button', { name: /disabled btn/i });
    expect(btn).toBeDisabled();

    const user = userEvent.setup();
    await user.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders spinner and disables button when isLoading is true', () => {
    render(<Button isLoading>Loading Btn</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders icons when passed', () => {
    render(
      <Button
        icon={<span data-testid="left-icon">L</span>}
        iconRight={<span data-testid="right-icon">R</span>}
      >
        Icon Btn
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('renders react-router Link when "to" prop is passed', () => {
    render(
      <MemoryRouter>
        <Button to="/dashboard">Go to Dashboard</Button>
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /go to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders standard anchor link when "href" prop is passed', () => {
    render(<Button href="https://example.com">External Link</Button>);

    const link = screen.getByRole('link', { name: /external link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('applies variant and size styles properly', () => {
    const { rerender } = render(<Button variant="secondary" size="sm">Small Sec</Button>);
    let btn = screen.getByRole('button');
    expect(btn.className).toContain('text-xs');

    rerender(<Button variant="outline" size="lg">Large Outline</Button>);
    btn = screen.getByRole('button');
    expect(btn.className).toContain('text-base');

    rerender(<Button variant="ghost" size="md">Ghost</Button>);
    btn = screen.getByRole('button');
    expect(btn.className).toContain('text-sm');
  });
});
