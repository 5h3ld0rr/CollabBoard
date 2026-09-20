import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Column } from '../Column';
import type { Task } from '../../../types';

describe('Member 2: 32BitXenon - Live Column UI & Header Counters Suite', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'First Real-Time Task',
      status: 'todo',
      priority: 'high',
      boardId: 'board-1',
      order: 0,
      version: 1,
      tags: ['frontend'],
      createdAt: '2026-09-13T10:00:00.000Z',
      updatedAt: '2026-09-13T10:00:00.000Z',
    },
    {
      id: 'task-2',
      title: 'Second Real-Time Task',
      status: 'todo',
      priority: 'medium',
      boardId: 'board-1',
      order: 1,
      version: 1,
      tags: ['backend'],
      createdAt: '2026-09-13T10:05:00.000Z',
      updatedAt: '2026-09-13T10:05:00.000Z',
    },
  ];

  const defaultProps = {
    title: 'To Do',
    status: 'todo' as const,
    colorDot: 'bg-blue-400',
    accentBadge: 'bg-blue-500/20 text-blue-300',
    tasks: mockTasks,
    onAddTask: vi.fn(),
    onEditTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onMoveStatus: vi.fn(),
    onDropTask: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dynamic column header and live task counter badge', () => {
    render(
      <MemoryRouter>
        <Column {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('column-header-todo').textContent).toBe('To Do');
    expect(screen.getByTestId('column-task-count-todo').textContent).toBe('2');
  });

  it('reactively updates count badge when tasks array dynamically changes', () => {
    const { rerender } = render(
      <MemoryRouter>
        <Column {...defaultProps} tasks={mockTasks} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('column-task-count-todo').textContent).toBe('2');

    // Add another task live
    const updatedTasks: Task[] = [
      ...mockTasks,
      {
        id: 'task-3',
        title: 'Third Dynamic Task',
        status: 'todo',
        priority: 'urgent',
        boardId: 'board-1',
        order: 2,
        version: 1,
        tags: [],
        createdAt: '2026-09-13T10:10:00.000Z',
        updatedAt: '2026-09-13T10:10:00.000Z',
      },
    ];

    rerender(
      <MemoryRouter>
        <Column {...defaultProps} tasks={updatedTasks} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('column-task-count-todo').textContent).toBe('3');

    // Remove all tasks
    rerender(
      <MemoryRouter>
        <Column {...defaultProps} tasks={[]} />
      </MemoryRouter>
    );
    expect(screen.getByTestId('column-task-count-todo').textContent).toBe('0');
  });

  it('triggers onAddTask when Add Task button is clicked', () => {
    render(
      <MemoryRouter>
        <Column {...defaultProps} />
      </MemoryRouter>
    );

    const addBtn = screen.getByTitle('Add task to To Do');
    fireEvent.click(addBtn);

    expect(defaultProps.onAddTask).toHaveBeenCalledWith('todo');
  });

  it('handles drag-and-drop actions and triggers onDropTask with payload data', () => {
    render(
      <MemoryRouter>
        <Column {...defaultProps} />
      </MemoryRouter>
    );

    const columnContainer = screen.getByTestId('column-header-todo').closest('.flex.flex-col')!;

    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        getData: vi.fn().mockReturnValue('task-99'),
      },
    };

    fireEvent.dragOver(columnContainer);
    fireEvent.drop(columnContainer, dropEvent);

    expect(defaultProps.onDropTask).toHaveBeenCalledWith('task-99', 'todo');
  });

  it('renders read-only mode correctly without action buttons or drop triggers', () => {
    render(
      <MemoryRouter>
        <Column {...defaultProps} readOnly={true} tasks={[]} />
      </MemoryRouter>
    );

    expect(screen.queryByTitle('Add task to To Do')).toBeNull();
    expect(screen.getByText('No tasks')).toBeDefined();
  });
});
