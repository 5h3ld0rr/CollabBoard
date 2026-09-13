import type { Task, TaskStatus } from '../types';

export interface ColumnTaskCounts {
  todo: number;
  'in-progress': number;
  done: number;
}

/**
 * Computes reactive task counts per status column.
 */
export function calculateColumnCounts(tasks: Task[]): ColumnTaskCounts {
  const counts: ColumnTaskCounts = {
    todo: 0,
    'in-progress': 0,
    done: 0,
  };

  if (!Array.isArray(tasks)) return counts;

  for (const task of tasks) {
    if (task.status === 'todo' || task.status === 'in-progress' || task.status === 'done') {
      counts[task.status] += 1;
    }
  }

  return counts;
}

/**
 * Returns task count for a given column status.
 */
export function getEffectiveTaskCount(tasks: Task[], status: TaskStatus): number {
  if (!Array.isArray(tasks)) return 0;
  return tasks.filter((t) => t.status === status).length;
}

/**
 * Filters tasks belonging to a specific status and sorts them by order / updatedAt.
 */
export function filterAndSortTasksByColumn(tasks: Task[], status: TaskStatus): Task[] {
  if (!Array.isArray(tasks)) return [];

  return tasks
    .filter((task) => task.status === status)
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
        return a.order - b.order;
      }
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
}

/**
 * Reorders column arrays immutably for drag-and-drop column positioning.
 */
export function reorderItems<T>(items: T[], startIndex: number, endIndex: number): T[] {
  if (!Array.isArray(items)) return [];
  if (startIndex < 0 || startIndex >= items.length || endIndex < 0 || endIndex >= items.length) {
    return [...items];
  }

  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}
