import { describe, it, expect } from 'vitest';
import { hasBoardChanged, hasBoardsChanged, hasTaskChanged, hasTasksChanged } from '../diff';
import type { Board, Task } from '../../types';

describe('diff utils', () => {
  describe('hasBoardChanged', () => {
    const baseBoard: Board = {
      id: 'b1',
      workspaceId: 'w1',
      title: 'Project Alpha',
      description: 'Test Description',
      members: ['u1', 'u2'] as any,
      tags: ['frontend', 'v1'],
      isFavorite: false,
      color: '#ffffff',
      icon: 'star',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    } as unknown as Board;

    it('returns false if both are null or undefined', () => {
      expect(hasBoardChanged(null, null)).toBe(false);
      expect(hasBoardChanged(undefined, undefined)).toBe(false);
    });

    it('returns true if one is missing', () => {
      expect(hasBoardChanged(baseBoard, null)).toBe(true);
      expect(hasBoardChanged(null, baseBoard)).toBe(true);
    });

    it('returns true if IDs differ', () => {
      expect(hasBoardChanged(baseBoard, { ...baseBoard, id: 'b2' })).toBe(true);
    });

    it('returns true if updatedAt differs', () => {
      expect(hasBoardChanged(baseBoard, { ...baseBoard, updatedAt: '2026-02-01T00:00:00.000Z' })).toBe(true);
    });

    it('returns true if title or description differs', () => {
      expect(hasBoardChanged(baseBoard, { ...baseBoard, title: 'Changed' })).toBe(true);
      expect(hasBoardChanged(baseBoard, { ...baseBoard, description: 'Changed' })).toBe(true);
    });

    it('returns true if members or tags length differs', () => {
      expect(hasBoardChanged(baseBoard, { ...baseBoard, members: ['u1'] as any })).toBe(true);
      expect(hasBoardChanged(baseBoard, { ...baseBoard, tags: ['frontend'] })).toBe(true);
    });

    it('returns true if favorite, color or icon differs', () => {
      expect(hasBoardChanged(baseBoard, { ...baseBoard, isFavorite: true })).toBe(true);
      expect(hasBoardChanged(baseBoard, { ...baseBoard, color: '#000000' })).toBe(true);
      expect(hasBoardChanged(baseBoard, { ...baseBoard, icon: 'bolt' })).toBe(true);
    });

    it('returns false if identical', () => {
      expect(hasBoardChanged(baseBoard, { ...baseBoard })).toBe(false);
    });
  });

  describe('hasBoardsChanged', () => {
    const board1: Board = { id: 'b1', workspaceId: 'w1', title: 'B1', updatedAt: '2026-01-01' } as any;
    const board2: Board = { id: 'b2', workspaceId: 'w1', title: 'B2', updatedAt: '2026-01-01' } as any;

    it('returns false if both are null or undefined', () => {
      expect(hasBoardsChanged(null, null)).toBe(false);
    });

    it('returns true if one is null or lengths differ', () => {
      expect(hasBoardsChanged([board1], null)).toBe(true);
      expect(hasBoardsChanged([board1], [board1, board2])).toBe(true);
    });

    it('returns true if an item is not found in cache or changed', () => {
      const board3: Board = { id: 'b3', workspaceId: 'w1', title: 'B3', updatedAt: '2026-01-01' } as any;
      expect(hasBoardsChanged([board1, board2], [board1, board3])).toBe(true);

      const modifiedBoard1 = { ...board1, title: 'Updated B1' };
      expect(hasBoardsChanged([board1, board2], [modifiedBoard1, board2])).toBe(true);
    });

    it('returns false when lists contain identical boards', () => {
      expect(hasBoardsChanged([board1, board2], [{ ...board1 }, { ...board2 }])).toBe(false);
    });
  });

  describe('hasTaskChanged', () => {
    const baseTask: Task = {
      id: 't1',
      boardId: 'b1',
      title: 'Task 1',
      description: 'Desc',
      status: 'todo',
      priority: 'medium',
      order: 1,
      version: 1,
      assignee: 'u1' as any,
      tags: ['bug'],
      dueDate: '2026-09-30',
      commentCount: 0,
      updatedAt: '2026-01-01',
      createdAt: '2026-01-01',
    } as unknown as Task;

    it('returns false when both null/undefined', () => {
      expect(hasTaskChanged(null, null)).toBe(false);
    });

    it('returns true when one is null or IDs mismatch', () => {
      expect(hasTaskChanged(baseTask, null)).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, id: 't2' })).toBe(true);
    });

    it('returns true when version or updatedAt changes', () => {
      expect(hasTaskChanged(baseTask, { ...baseTask, version: 2 })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, updatedAt: '2026-02-01' })).toBe(true);
    });

    it('returns true when status, title, priority, order, or description changes', () => {
      expect(hasTaskChanged(baseTask, { ...baseTask, status: 'in-progress' })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, title: 'New Title' })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, priority: 'high' })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, order: 2 })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, description: 'New Desc' })).toBe(true);
    });

    it('handles assignee changes correctly whether object or string ID', () => {
      expect(hasTaskChanged(baseTask, { ...baseTask, assignee: 'u2' as any })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, assignee: { id: 'u1', name: 'User 1' } as any })).toBe(false);
      expect(hasTaskChanged(baseTask, { ...baseTask, assignee: { id: 'u2', name: 'User 2' } as any })).toBe(true);
    });

    it('detects tags, dueDate, and commentCount differences', () => {
      expect(hasTaskChanged(baseTask, { ...baseTask, tags: ['bug', 'feature'] })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, tags: ['feature'] })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, dueDate: '2026-10-01' })).toBe(true);
      expect(hasTaskChanged(baseTask, { ...baseTask, commentCount: 3 })).toBe(true);
    });

    it('returns false for identical tasks', () => {
      expect(hasTaskChanged(baseTask, { ...baseTask })).toBe(false);
    });
  });

  describe('hasTasksChanged', () => {
    const t1: Task = { id: 't1', title: 'T1' } as any;
    const t2: Task = { id: 't2', title: 'T2' } as any;

    it('returns false when both null/undefined', () => {
      expect(hasTasksChanged(null, null)).toBe(false);
    });

    it('returns true when length or membership differs', () => {
      expect(hasTasksChanged([t1], null)).toBe(true);
      expect(hasTasksChanged([t1], [t1, t2])).toBe(true);
      expect(hasTasksChanged([t1], [{ id: 't9', title: 'T9' } as any])).toBe(true);
    });

    it('returns true when task property changes', () => {
      expect(hasTasksChanged([t1], [{ ...t1, title: 'Updated' }])).toBe(true);
    });

    it('returns false when task arrays match', () => {
      expect(hasTasksChanged([t1, t2], [{ ...t1 }, { ...t2 }])).toBe(false);
    });
  });
});
