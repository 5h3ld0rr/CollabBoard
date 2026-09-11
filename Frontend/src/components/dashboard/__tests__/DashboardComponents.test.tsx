import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { BoardCard } from '../BoardCard';
import { WorkspaceStats } from '../WorkspaceStats';
import type { Board } from '../../../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('dashboard components', () => {
  describe('BoardCard', () => {
    const mockBoard: Board = {
      id: 'b_test',
      workspaceId: 'w_1',
      title: 'Frontend Roadmap',
      description: 'Q3 feature planning',
      isFavorite: false,
      tags: ['react', 'ui'],
      members: ['u1', 'u2'] as any,
      stats: {
        totalTasks: 10,
        doneCount: 6,
        inProgressCount: 2,
        todoCount: 2,
      },
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    } as unknown as Board;

    it('renders board details, progress and triggers navigation on click', async () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter>
          <BoardCard board={mockBoard} onToggleFavorite={handleToggle} />
        </MemoryRouter>
      );

      expect(screen.getByText('Frontend Roadmap')).toBeInTheDocument();
      expect(screen.getByText('Q3 feature planning')).toBeInTheDocument();
      expect(screen.getByText('#react')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();

      const user = userEvent.setup();
      const card = screen.getByText('Frontend Roadmap').closest('div[class*="rounded-2xl"]');
      if (card) {
        await user.click(card);
        expect(mockNavigate).toHaveBeenCalledWith('/boards/b_test');
      }
    });

    it('toggles favorite star without triggering card navigation', async () => {
      mockNavigate.mockClear();
      const handleToggle = vi.fn();
      render(
        <MemoryRouter>
          <BoardCard board={mockBoard} onToggleFavorite={handleToggle} />
        </MemoryRouter>
      );

      const user = userEvent.setup();
      const starBtn = screen.getByTitle(/star this board/i);
      await user.click(starBtn);

      expect(handleToggle).toHaveBeenCalledWith('b_test');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('WorkspaceStats', () => {
    const boards: Board[] = [
      {
        id: 'b1',
        workspaceId: 'w1',
        title: 'B1',
        members: ['u1', 'u2'] as any,
        stats: { totalTasks: 10, inProgressCount: 3, doneCount: 5, todoCount: 2 },
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        id: 'b2',
        workspaceId: 'w1',
        title: 'B2',
        members: ['u2', { id: 'u3' }] as any,
        stats: { totalTasks: 10, inProgressCount: 2, doneCount: 5, todoCount: 3 },
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ] as unknown as Board[];

    it('renders aggregate statistics accurately', () => {
      render(<WorkspaceStats boards={boards} workspaceName="Acme Corp" />);

      expect(screen.getByText('Active Boards')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('in Acme Corp')).toBeInTheDocument();

      expect(screen.getByText('Tasks In Flight')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();

      expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('50% completion rate')).toBeInTheDocument();

      expect(screen.getByText('Collaborators')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
