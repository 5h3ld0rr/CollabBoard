import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BoardMembersModal } from '../BoardMembersModal';
import type { Board, User } from '../../../types';

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-admin',
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

// Mock TemporaryLinkGenerator to keep test isolated
vi.mock('../TemporaryLinkGenerator', () => ({
  TemporaryLinkGenerator: ({ boardId }: { boardId: string }) => (
    <div data-testid="mock-temporary-link-generator">Temporary Link: {boardId}</div>
  ),
}));

describe('BoardMembersModal Component', () => {
  const mockBoard: Board = {
    id: 'board-123',
    createdAt: '2026-09-14T10:00:00.000Z',
    updatedAt: '2026-09-14T12:00:00.000Z',
    title: 'Sprint 24 Board',
    description: 'Real-time collaborative sprint',
    workspaceId: 'ws-1',
    workspaceName: 'Engineering',
    color: 'from-blue-600 to-indigo-600',
    icon: 'Kanban',
    isFavorite: false,
    ownerId: 'owner-1',
    members: [
      {
        id: 'owner-1',
        name: 'Sarah Connor',
        email: 'sarah@collabboard.io',
        initials: 'SC',
        color: 'bg-amber-600',
        boardRole: 'Owner',
      },
      {
        id: 'user-admin',
        name: 'Admin User',
        email: 'admin@collabboard.io',
        initials: 'AU',
        color: 'bg-sky-600',
        boardRole: 'Admin',
      },
      {
        id: 'user-3',
        name: 'John Doe',
        email: 'john@collabboard.io',
        initials: 'JD',
        color: 'bg-indigo-600',
        boardRole: 'Editor',
      },
    ],
    tags: ['sprint'],
    stats: {
      totalTasks: 3,
      todoCount: 1,
      inProgressCount: 1,
      doneCount: 1,
    },
  };

  const mockWorkspaceMembers: User[] = [
    {
      id: 'ws-user-4',
      name: 'Alice Cooper',
      email: 'alice@collabboard.io',
      initials: 'AC',
      color: 'bg-emerald-600',
      role: 'Member',
    },
    {
      id: 'ws-user-5',
      name: 'Bob Marley',
      email: 'bob@collabboard.io',
      initials: 'BM',
      color: 'bg-violet-600',
      role: 'Member',
    },
  ];

  const onCloseMock = vi.fn();
  const onUpdateMembersMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <BoardMembersModal
        isOpen={false}
        onClose={onCloseMock}
        board={mockBoard}
        onUpdateMembers={onUpdateMembersMock}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal header, members list, role badges, and link generator when open', () => {
    render(
      <BoardMembersModal
        isOpen={true}
        onClose={onCloseMock}
        board={mockBoard}
        onUpdateMembers={onUpdateMembersMock}
        workspaceMembers={mockWorkspaceMembers}
      />
    );

    expect(screen.getByText('Board Collaborators')).toBeInTheDocument();
    expect(screen.getByText(/Sprint 24 Board/)).toBeInTheDocument();
    expect(screen.getByTestId('mock-temporary-link-generator')).toBeInTheDocument();

    // Member names
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Owner badge
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('allows adding a teammate from workspace dropdown', async () => {
    render(
      <BoardMembersModal
        isOpen={true}
        onClose={onCloseMock}
        board={mockBoard}
        onUpdateMembers={onUpdateMembersMock}
        workspaceMembers={mockWorkspaceMembers}
      />
    );

    const selectDropdown = screen.getByRole('combobox', { name: 'Select teammate to invite' });
    fireEvent.change(selectDropdown, { target: { value: 'ws-user-4' } });

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(onUpdateMembersMock).toHaveBeenCalledTimes(1);
      const updatedList = onUpdateMembersMock.mock.calls[0][0];
      expect(updatedList).toHaveLength(4);
      expect(updatedList.some((m: User) => m.id === 'ws-user-4' && m.name === 'Alice Cooper')).toBe(true);
    });
  });

  it('allows adding a collaborator by typing an email address', async () => {
    render(
      <BoardMembersModal
        isOpen={true}
        onClose={onCloseMock}
        board={mockBoard}
        onUpdateMembers={onUpdateMembersMock}
        workspaceMembers={[]} // No teammates, renders direct email input
      />
    );

    const emailInput = screen.getByPlaceholderText('colleague@collabboard.io');
    fireEvent.change(emailInput, { target: { value: 'developer@nsbm.lk' } });

    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(onUpdateMembersMock).toHaveBeenCalledTimes(1);
      const updatedList = onUpdateMembersMock.mock.calls[0][0];
      expect(updatedList.some((m: User) => m.email === 'developer@nsbm.lk')).toBe(true);
    });
  });

  it('allows modifying role of an eligible member and updates role', async () => {
    render(
      <BoardMembersModal
        isOpen={true}
        onClose={onCloseMock}
        board={mockBoard}
        onUpdateMembers={onUpdateMembersMock}
        workspaceMembers={mockWorkspaceMembers}
      />
    );

    // John Doe's role dropdown (John Doe is Editor, not Owner or Self)
    const johnRoleSelect = screen.getByRole('combobox', { name: 'Role for John Doe' });
    fireEvent.change(johnRoleSelect, { target: { value: 'Admin' } });

    await waitFor(() => {
      expect(onUpdateMembersMock).toHaveBeenCalledTimes(1);
      const updated = onUpdateMembersMock.mock.calls[0][0];
      const john = updated.find((m: User) => m.id === 'user-3');
      expect(john.boardRole).toBe('Admin');
    });
  });

  it('allows removing an eligible member', async () => {
    render(
      <BoardMembersModal
        isOpen={true}
        onClose={onCloseMock}
        board={mockBoard}
        onUpdateMembers={onUpdateMembersMock}
        workspaceMembers={mockWorkspaceMembers}
      />
    );

    const removeButtons = screen.getAllByTitle('Remove member from board');
    // John Doe has a remove button, owner and self do not
    expect(removeButtons).toHaveLength(1);

    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(onUpdateMembersMock).toHaveBeenCalledTimes(1);
      const updated = onUpdateMembersMock.mock.calls[0][0];
      expect(updated.some((m: User) => m.id === 'user-3')).toBe(false);
    });
  });

  it('triggers onClose when clicking close or Done button', () => {
    render(
      <BoardMembersModal
        isOpen={true}
        onClose={onCloseMock}
        board={mockBoard}
        onUpdateMembers={onUpdateMembersMock}
      />
    );

    const doneButton = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
