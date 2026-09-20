import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemporaryLinkGenerator } from '../TemporaryLinkGenerator';
import * as boardsApi from '../../../api/boards';

vi.mock('../../../api/boards', () => ({
  generateShareToken: vi.fn(),
  resetShareToken: vi.fn(),
  getActiveShareToken: vi.fn(),
}));

describe('TemporaryLinkGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(boardsApi.getActiveShareToken).mockResolvedValue(null);
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders duration pills and Generate Link button initially without printing raw URL string', () => {
    render(<TemporaryLinkGenerator boardId="board-123" />);

    expect(screen.getByText('Temporary View-Only Link')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '24h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Never' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate link/i })).toBeInTheDocument();

    // No raw URL string should be displayed
    expect(screen.queryByText(/http:\/\/localhost:5173/)).not.toBeInTheDocument();
  });

  it('generates link on click, showing Copy Link and Reset buttons', async () => {
    vi.mocked(boardsApi.generateShareToken).mockResolvedValueOnce({
      token: 'jwt.mock.token',
      expiresAt: '2026-09-14T12:00:00.000Z',
      expiresIn: '24h',
      shareUrl: 'http://localhost:5173/boards/board-123?shareToken=jwt.mock.token',
    });

    render(<TemporaryLinkGenerator boardId="board-123" />);

    const generateBtn = screen.getByRole('button', { name: /generate link/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(boardsApi.generateShareToken).toHaveBeenCalledWith('board-123', '24h');
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    // Still no raw URL string displayed
    expect(screen.queryByText(/http:\/\/localhost:5173/)).not.toBeInTheDocument();
  });

  it('copies link to clipboard when Copy Link is clicked', async () => {
    vi.mocked(boardsApi.generateShareToken).mockResolvedValueOnce({
      token: 'jwt.mock.token',
      expiresAt: '2026-09-14T12:00:00.000Z',
      expiresIn: '24h',
      shareUrl: 'http://localhost:5173/boards/board-123?shareToken=jwt.mock.token',
    });

    render(<TemporaryLinkGenerator boardId="board-123" />);

    fireEvent.click(screen.getByRole('button', { name: /generate link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });

    const copyBtn = screen.getByRole('button', { name: /copy link/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:5173/boards/board-123?shareToken=jwt.mock.token'
      );
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('resets and revokes link when Reset button is clicked', async () => {
    vi.mocked(boardsApi.generateShareToken).mockResolvedValueOnce({
      token: 'jwt.mock.token',
      expiresAt: '2026-09-14T12:00:00.000Z',
      expiresIn: '24h',
      shareUrl: 'http://localhost:5173/boards/board-123?shareToken=jwt.mock.token',
    });
    vi.mocked(boardsApi.resetShareToken).mockResolvedValueOnce(true);

    render(<TemporaryLinkGenerator boardId="board-123" />);

    fireEvent.click(screen.getByRole('button', { name: /generate link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(boardsApi.resetShareToken).toHaveBeenCalledWith('board-123');
      expect(screen.getByRole('button', { name: /generate link/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /copy link/i })).not.toBeInTheDocument();
    });
  });

  it('displays error if generation fails and allows retry', async () => {
    vi.mocked(boardsApi.generateShareToken)
      .mockRejectedValueOnce(new Error('Failed to generate'))
      .mockResolvedValueOnce({
        token: 'token.retry',
        expiresAt: '2026-09-14T12:00:00.000Z',
        expiresIn: '24h',
        shareUrl: 'http://localhost:5173/boards/board-123?shareToken=token.retry',
      });

    render(<TemporaryLinkGenerator boardId="board-123" />);

    fireEvent.click(screen.getByRole('button', { name: /generate link/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to generate')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(boardsApi.generateShareToken).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });
  });

  it('allows selecting Never option and generates non-expiring link', async () => {
    vi.mocked(boardsApi.generateShareToken).mockResolvedValueOnce({
      token: 'jwt.mock.never.token',
      expiresAt: null,
      expiresIn: 'never',
      shareUrl: 'http://localhost:5173/boards/board-123?shareToken=jwt.mock.never.token',
    });

    render(<TemporaryLinkGenerator boardId="board-123" />);

    const neverBtn = screen.getByRole('button', { name: 'Never' });
    fireEvent.click(neverBtn);

    const generateBtn = screen.getByRole('button', { name: /generate link/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(boardsApi.generateShareToken).toHaveBeenCalledWith('board-123', 'never');
      expect(screen.getByText(/Active \(Never expires\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });
  });

  it('shows Copy Link and Reset buttons instead of Generate when an active link already exists', async () => {
    vi.mocked(boardsApi.getActiveShareToken).mockResolvedValueOnce({
      token: 'existing.share.token',
      expiresAt: '2026-09-15T12:00:00.000Z',
      expiresIn: '7d',
      shareUrl: 'http://localhost:5173/boards/board-123?shareToken=existing.share.token',
    });

    render(<TemporaryLinkGenerator boardId="board-123" />);

    await waitFor(() => {
      // Shows Copy Link and Reset instead of Generate Link
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /generate link/i })).not.toBeInTheDocument();
      expect(screen.getByText(/Active \(7d\)/i)).toBeInTheDocument();
    });
  });
});
