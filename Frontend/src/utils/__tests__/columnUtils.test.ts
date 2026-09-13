import { describe, it, expect } from 'vitest';
import {
  calculateColumnCounts,
  getEffectiveTaskCount,
  filterAndSortTasksByColumn,
  reorderItems,
} from '../columnUtils';
import type { Task } from '../../types';

describe('Member 2: Ruwini Kanchana - columnUtils Suite', () => {
  const sampleTasks: Task[] = [
    {
      id: 't-1',
      title: 'Task 1',
      status: 'todo',
      order: 0,
      boardId: 'b-1',
      priority: 'medium',
      version: 1,
      tags: [],
      createdAt: '2026-09-13T10:00:00.000Z',
      updatedAt: '2026-09-13T10:00:00.000Z',
    },
    {
      id: 't-2',
      title: 'Task 2',
      status: 'todo',
      order: 1,
      boardId: 'b-1',
      priority: 'high',
      version: 1,
      tags: [],
      createdAt: '2026-09-13T10:05:00.000Z',
      updatedAt: '2026-09-13T10:05:00.000Z',
    },
    {
      id: 't-3',
      title: 'Task 3',
      status: 'in-progress',
      order: 0,
      boardId: 'b-1',
      priority: 'urgent',
      version: 1,
      tags: [],
      createdAt: '2026-09-13T10:10:00.000Z',
      updatedAt: '2026-09-13T10:10:00.000Z',
    },
    {
      id: 't-4',
      title: 'Task 4',
      status: 'done',
      order: 0,
      boardId: 'b-1',
      priority: 'low',
      version: 1,
      tags: [],
      createdAt: '2026-09-13T10:15:00.000Z',
      updatedAt: '2026-09-13T10:15:00.000Z',
    },
  ];

  it('calculates task counts accurately across all columns', () => {
    const counts = calculateColumnCounts(sampleTasks);
    expect(counts).toEqual({
      todo: 2,
      'in-progress': 1,
      done: 1,
    });
  });

  it('handles empty task list gracefully with zero counts', () => {
    const counts = calculateColumnCounts([]);
    expect(counts).toEqual({
      todo: 0,
      'in-progress': 0,
      done: 0,
    });
  });

  it('gets effective task count for individual column status', () => {
    expect(getEffectiveTaskCount(sampleTasks, 'todo')).toBe(2);
    expect(getEffectiveTaskCount(sampleTasks, 'in-progress')).toBe(1);
    expect(getEffectiveTaskCount(sampleTasks, 'done')).toBe(1);
  });

  it('filters and sorts tasks by status and order', () => {
    const todoTasks = filterAndSortTasksByColumn(sampleTasks, 'todo');
    expect(todoTasks).toHaveLength(2);
    expect(todoTasks[0].id).toBe('t-1');
    expect(todoTasks[1].id).toBe('t-2');
  });

  it('reorders items immutably without side effects', () => {
    const columns = ['todo', 'in-progress', 'done'];
    const reordered = reorderItems(columns, 0, 2);

    expect(reordered).toEqual(['in-progress', 'done', 'todo']);
    // original array untouched
    expect(columns).toEqual(['todo', 'in-progress', 'done']);
  });

  it('returns clone of items if invalid indices provided', () => {
    const columns = ['todo', 'in-progress', 'done'];
    const result = reorderItems(columns, -1, 5);
    expect(result).toEqual(['todo', 'in-progress', 'done']);
  });
});
