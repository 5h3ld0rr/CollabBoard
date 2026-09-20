import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BoardSettingsModal } from '../BoardSettingsModal';
import type { Board } from '../../../types';

// Mock current logged in user
const mockCurrentUser = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@collabboard.io',
};

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    token: 'mock-token',
    isAuthenticated: true,
  }),
}));

describe('BoardSettingsModal Component', () => {
  const mockBoard: Board = {
    id: 'board-settings-1',
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z',
    title: 'Core Architecture',
    description: 'Sprint architecture and design board',
    workspaceId: 'ws-eng',
    workspaceName: 'Engineering',
    color: 'from-indigo-600 to-violet-600',
    icon: 'Kanban',
    tags: ['Architecture', 'Sprint'],
    isFavorite: false,
    ownerId: 'owner-alex',
    stats: {
      totalTasks: 4,
      todoCount: 2,
      inProgressCount: 1,
      doneCount: 1,
    },
    members: [
      {
        id: 'owner-alex',
        name: 'Alex Chen',
        email: 'alex@nsbm.lk',
        initials: 'AC',
        color: 'bg-indigo-600',
        boardRole: 'Owner',
      },
      {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@collabboard.io',
        initials: 'AU',
        color: 'bg-sky-600',
        boardRole: 'Admin',
      },
      {
        id: 'user-clara',
        name: 'Clara Tanaka',
        email: 'clara@nsbm.lk',
        initials: 'CT',
        color: 'bg-emerald-600',
        boardRole: 'Editor',
      },
    ],
  };

  const mockOnClose = vi.fn();
  const mockOnUpdateBoard = vi.fn().mockResolvedValue(undefined);
  const mockOnDeleteBoard = vi.fn();
  const mockOnClearTasks = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <BoardSettingsModal
        isOpen={false}
        onClose={mockOnClose}
        board={mockBoard}
        onUpdateBoard={mockOnUpdateBoard}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders general settings tab and updates board metadata on form submit', async () => {
    render(
      <BoardSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        board={mockBoard}
        onUpdateBoard={mockOnUpdateBoard}
      />
    );

    expect(screen.getByRole('heading', { name: /board settings/i })).toBeInTheDocument();
    const titleInput = screen.getByDisplayValue('Core Architecture');
    const descInput = screen.getByDisplayValue('Sprint architecture and design board');

    fireEvent.change(titleInput, { target: { value: 'Updated Core Architecture' } });
    fireEvent.change(descInput, { target: { value: 'Updated description' } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnUpdateBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Core Architecture',
          description: 'Updated description',
        })
      );
      expect(screen.getByText(/board general settings updated!/i)).toBeInTheDocument();
    });
  });

  it('allows switching workspace from general settings tab', async () => {
    const mockWorkspaces = [
      { id: 'ws-1', name: 'Engineering', description: 'Eng' },
      { id: 'ws-2', name: 'Product Team', description: 'Product' },
    ];

    render(
      <BoardSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        board={{ ...mockBoard, workspaceId: 'ws-1' }}
        workspaces={mockWorkspaces}
        onUpdateBoard={mockOnUpdateBoard}
      />
    );

    const workspaceSelect = screen.getByRole('combobox');
    expect(workspaceSelect).toBeInTheDocument();
    expect(workspaceSelect).toHaveValue('ws-1');

    fireEvent.change(workspaceSelect, { target: { value: 'ws-2' } });

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockOnUpdateBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'ws-2',
          workspaceName: 'Product Team',
        })
      );
    });
  });

  it('renders only General and Danger Zone tabs and does not show share or members tabs', () => {
    render(
      <BoardSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        board={mockBoard}
        onUpdateBoard={mockOnUpdateBoard}
      />
    );

    expect(screen.getByRole('button', { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /danger zone/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /members/i })).not.toBeInTheDocument();
  });

  it('supports initialTab="danger" and opens directly on Danger Zone', () => {
    render(
      <BoardSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        board={mockBoard}
        onUpdateBoard={mockOnUpdateBoard}
        initialTab="danger"
      />
    );

    expect(screen.getByText(/clear all tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/delete this board/i)).toBeInTheDocument();
  });

  it('navigates to Danger Zone tab, confirms task clearing and board deletion', () => {
    render(
      <BoardSettingsModal
        isOpen={true}
        onClose={mockOnClose}
        board={mockBoard}
        onUpdateBoard={mockOnUpdateBoard}
        onDeleteBoard={mockOnDeleteBoard}
        onClearTasks={mockOnClearTasks}
      />
    );

    const dangerTab = screen.getByRole('button', { name: /danger zone/i });
    fireEvent.click(dangerTab);

    // Test Clear Tasks flow
    const clearBtn = screen.getByRole('button', { name: /clear tasks/i });
    fireEvent.click(clearBtn);

    const confirmClearBtn = screen.getByRole('button', { name: /confirm clear/i });
    fireEvent.click(confirmClearBtn);
    expect(mockOnClearTasks).toHaveBeenCalledTimes(1);

    // Test Delete Board flow
    const deleteBtn = screen.getByRole('button', { name: /delete board/i });
    fireEvent.click(deleteBtn);

    const confirmDeleteBtn = screen.getByRole('button', { name: /yes, delete board/i });
    fireEvent.click(confirmDeleteBtn);
    expect(mockOnDeleteBoard).toHaveBeenCalledWith('board-settings-1');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
