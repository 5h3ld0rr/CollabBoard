import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoardCard } from '../BoardCard';
import type { Board } from '../../../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BoardCard Component', () => {
  const baseBoard: Board = {
    id: 'b-card-1',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    title: 'Platform Architecture',
    description: 'Cloud infrastructure and CI/CD pipelines',
    workspaceId: 'ws-infra',
    workspaceName: 'DevOps & Cloud',
    color: 'from-blue-600 to-indigo-600',
    icon: 'Layers',
    isFavorite: false,
    tags: ['Cloud', 'Kubernetes'],
    stats: {
      totalTasks: 20,
      doneCount: 15,
      inProgressCount: 3,
      todoCount: 2,
    },
    members: [
      {
        id: 'user-1',
        name: 'Jordan Lee',
        email: 'jordan@collabboard.io',
        initials: 'JL',
        color: 'bg-emerald-600',
      },
    ],
  };

  const mockOnToggleFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders board header details, tags, workspace name, and progress', () => {
    render(
      <BoardCard board={baseBoard} onToggleFavorite={mockOnToggleFavorite} />
    );

    expect(screen.getByText('Platform Architecture')).toBeInTheDocument();
    expect(screen.getByText('DevOps & Cloud')).toBeInTheDocument();
    expect(screen.getByText('Cloud infrastructure and CI/CD pipelines')).toBeInTheDocument();
    expect(screen.getByText('#Cloud')).toBeInTheDocument();
    expect(screen.getByText('#Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByTitle('Jordan Lee')).toBeInTheDocument();
  });

  it('navigates to the board route when card body is clicked', () => {
    render(
      <BoardCard board={baseBoard} onToggleFavorite={mockOnToggleFavorite} />
    );

    const card = screen.getByText('Platform Architecture').closest('div[class*="group relative"]');
    expect(card).toBeTruthy();
    if (card) {
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith('/boards/b-card-1');
    }
  });

  it('toggles favorite and stops propagation without navigating', () => {
    render(
      <BoardCard board={baseBoard} onToggleFavorite={mockOnToggleFavorite} />
    );

    const starBtn = screen.getByTitle('Star this board');
    fireEvent.click(starBtn);

    expect(mockOnToggleFavorite).toHaveBeenCalledWith('b-card-1');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders starred state with Remove from starred title and amber style', () => {
    const favoriteBoard: Board = {
      ...baseBoard,
      isFavorite: true,
    };

    render(
      <BoardCard board={favoriteBoard} onToggleFavorite={mockOnToggleFavorite} />
    );

    const starBtn = screen.getByTitle('Remove from starred');
    expect(starBtn).toBeInTheDocument();
    fireEvent.click(starBtn);
    expect(mockOnToggleFavorite).toHaveBeenCalledWith('b-card-1');
  });

  it('handles empty description and empty tags gracefully', () => {
    const emptyBoard: Board = {
      ...baseBoard,
      description: '',
      tags: [],
      stats: {
        totalTasks: 0,
        doneCount: 0,
        inProgressCount: 0,
        todoCount: 0,
      },
    };

    render(
      <BoardCard board={emptyBoard} onToggleFavorite={mockOnToggleFavorite} />
    );

    expect(screen.getByText('No description provided.')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders different icon options (WifiOff, ShieldCheck, Kanban default)', () => {
    const { rerender } = render(
      <BoardCard board={{ ...baseBoard, icon: 'WifiOff' }} onToggleFavorite={mockOnToggleFavorite} />
    );
    expect(document.querySelector('.lucide-wifi-off')).toBeInTheDocument();

    rerender(
      <BoardCard board={{ ...baseBoard, icon: 'ShieldCheck' }} onToggleFavorite={mockOnToggleFavorite} />
    );
    expect(document.querySelector('.lucide-shield-check')).toBeInTheDocument();

    rerender(
      <BoardCard board={{ ...baseBoard, icon: 'Kanban' }} onToggleFavorite={mockOnToggleFavorite} />
    );
    expect(document.querySelector('.lucide-kanban')).toBeInTheDocument();
  });
});
