import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Column } from '../board/Column';
import type { Task } from '../../types';

describe('Column Component', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Design Auth Flow',
      status: 'todo',
      priority: 'high',
      boardId: 'board-1',
      order: 1,
      version: 1,
      tags: ['auth'],
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
    },
    {
      id: 'task-2',
      title: 'Integrate PouchDB Sync',
      status: 'todo',
      priority: 'medium',
      boardId: 'board-1',
      order: 2,
      version: 1,
      tags: ['sync'],
      createdAt: '2026-09-12T00:00:00Z',
      updatedAt: '2026-09-12T00:00:00Z',
    },
  ];

  const defaultProps = {
    title: 'To Do',
    status: 'todo' as const,
    colorDot: 'bg-amber-400',
    accentBadge: 'bg-amber-500/10 text-amber-300',
    tasks: mockTasks,
    onAddTask: vi.fn(),
    onEditTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onMoveStatus: vi.fn(),
    onDropTask: vi.fn(),
  };

  const renderColumn = (props = defaultProps) => {
    return render(
      <MemoryRouter>
        <Column {...props} />
      </MemoryRouter>
    );
  };

  it('verifies column renders correct column header using accessible heading role', () => {
    renderColumn();

    const columnHeading = screen.getByRole('heading', {
      name: 'To Do',
      level: 3,
    });
    expect(columnHeading).toBeInTheDocument();
  });

  it('verifies column renders accurate task count badge', () => {
    renderColumn();

    const countBadge = screen.getByText('2');
    expect(countBadge).toBeInTheDocument();
  });

  it('verifies column renders all child task cards correctly', () => {
    renderColumn();

    // Verify each child task card title is rendered as an h4 heading
    const task1Heading = screen.getByRole('heading', {
      name: 'Design Auth Flow',
      level: 4,
    });
    const task2Heading = screen.getByRole('heading', {
      name: 'Integrate PouchDB Sync',
      level: 4,
    });

    expect(task1Heading).toBeInTheDocument();
    expect(task2Heading).toBeInTheDocument();
  });

  it('verifies placeholder state when column has 0 tasks', () => {
    renderColumn({
      ...defaultProps,
      tasks: [],
    });

    // Header count should be 0
    expect(screen.getByText('0')).toBeInTheDocument();

    // Empty state placeholder
    expect(screen.getByText('Drop card or click to add')).toBeInTheDocument();
  });

  it('triggers onAddTask when "+" button is clicked', () => {
    const onAddTask = vi.fn();
    renderColumn({
      ...defaultProps,
      onAddTask,
    });

    const addBtn = screen.getByRole('button', { name: /add task to to do/i });
    fireEvent.click(addBtn);

    expect(onAddTask).toHaveBeenCalledTimes(1);
    expect(onAddTask).toHaveBeenCalledWith('todo');
  });
});
