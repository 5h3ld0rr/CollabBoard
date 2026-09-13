import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TaskCard } from '../board/TaskCard';
import type { Task } from '../../types';

describe('TaskCard Component', () => {
  const baseTask: Task = {
    id: 'task-101',
    title: 'Implement Vitest Suite',
    description: 'Set up testing framework and RTL tests for components',
    status: 'in-progress',
    priority: 'high',
    boardId: 'board-1',
    order: 1,
    version: 1,
    dueDate: '2026-12-31',
    tags: ['testing', 'frontend'],
    commentCount: 3,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z',
    assignee: {
      id: 'user-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      initials: 'AJ',
      color: 'bg-emerald-600',
    },
  };

  const renderTaskCard = (task: Task) => {
    return render(
      <MemoryRouter>
        <TaskCard task={task} />
      </MemoryRouter>
    );
  };

  it('renders task heading using priority-1 accessible query getByRole', () => {
    renderTaskCard(baseTask);

    const heading = screen.getByRole('heading', {
      name: 'Implement Vitest Suite',
      level: 4,
    });
    expect(heading).toBeInTheDocument();
  });

  it('verifies visible labels for assignee, due date, and priority badge', () => {
    renderTaskCard(baseTask);

    // Assignee labels: first name and initials
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('AJ')).toBeInTheDocument();

    // Due date label (formatted slice: '12-31')
    expect(screen.getByText('12-31')).toBeInTheDocument();

    // Priority badge label
    expect(screen.getByText('High')).toBeInTheDocument();

    // Description and tags
    expect(screen.getByText('Set up testing framework and RTL tests for components')).toBeInTheDocument();
    expect(screen.getByText('#testing')).toBeInTheDocument();
    expect(screen.getByText('#frontend')).toBeInTheDocument();

    // Comment count
    expect(screen.getByText('3')).toBeInTheDocument();

    // Details navigation link
    const detailsLink = screen.getByRole('link', { name: /view details/i });
    expect(detailsLink).toHaveAttribute('href', '/tasks/task-101');
  });

  it('renders "Unassigned" placeholder when no assignee is present', () => {
    const unassignedTask: Task = {
      ...baseTask,
      assignee: undefined,
    };

    renderTaskCard(unassignedTask);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('verifies completed task visual state: element receives the expected done class and Done badge', () => {
    const doneTask: Task = {
      ...baseTask,
      status: 'done',
    };

    const { container } = renderTaskCard(doneTask);

    // Root card element has the done class
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('done');

    // Displays Done status badge
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('ensures active/incomplete task does not receive the done class', () => {
    const activeTask: Task = {
      ...baseTask,
      status: 'in-progress',
    };

    const { container } = renderTaskCard(activeTask);

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).not.toHaveClass('done');
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
  });

  it('renders Overdue badge when task is not done and past due date', () => {
    const overdueTask: Task = {
      ...baseTask,
      status: 'in-progress',
      dueDate: '2020-01-01',
    };

    renderTaskCard(overdueTask);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});
