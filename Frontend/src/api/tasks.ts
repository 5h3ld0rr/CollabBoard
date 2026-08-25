import { MOCK_TASKS, MOCK_COMMENTS, MOCK_CURRENT_USER } from '../data/mockData';
import type { Task, TaskStatus, TaskComment, User } from '../types';

/* In-memory mock storage simulation */
let tasksStorage: Record<string, Task[]> = JSON.parse(JSON.stringify(MOCK_TASKS));
let commentsStorage: Record<string, TaskComment[]> = JSON.parse(JSON.stringify(MOCK_COMMENTS));

/**
 * Fetch all tasks, optionally filtered by board ID
 */
export async function getTasks(boardId?: string): Promise<Task[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (boardId) {
    return tasksStorage[boardId] || [];
  }

  return Object.values(tasksStorage).flat();
}

/**
 * Fetch a single task by its unique ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  for (const taskList of Object.values(tasksStorage)) {
    const found = taskList.find((t) => t.id === taskId);
    if (found) return found;
  }

  return null;
}

/**
 * Create a new task in a board
 */
export async function createTask(
  boardId: string,
  taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'order'>
): Promise<Task> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const currentBoardTasks = tasksStorage[boardId] || [];
  const newTask: Task = {
    ...taskInput,
    id: `task-${Date.now()}`,
    boardId,
    order: currentBoardTasks.length + 1,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasksStorage[boardId] = [newTask, ...currentBoardTasks];
  return newTask;
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<Task> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  for (const [boardId, taskList] of Object.entries(tasksStorage)) {
    const index = taskList.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const updated: Task = {
        ...taskList[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        version: (taskList[index].version || 1) + 1,
      };
      tasksStorage[boardId][index] = updated;
      return updated;
    }
  }

  throw new Error(`Task with id "${taskId}" not found`);
}

/**
 * Update task status (e.g. todo -> in-progress -> done)
 */
export async function moveTaskStatus(
  taskId: string,
  newStatus: TaskStatus
): Promise<Task> {
  return updateTask(taskId, { status: newStatus });
}

/**
 * Delete a task by ID
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  for (const [boardId, taskList] of Object.entries(tasksStorage)) {
    const initialLength = taskList.length;
    tasksStorage[boardId] = taskList.filter((t) => t.id !== taskId);
    if (tasksStorage[boardId].length < initialLength) {
      return true;
    }
  }

  return false;
}

/**
 * Clear all tasks from a board
 */
export async function clearBoardTasks(boardId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  tasksStorage[boardId] = [];
  return true;
}

/**
 * Fetch all comments for a task
 */
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return commentsStorage[taskId] || [];
}

/**
 * Add a comment to a task
 */
export async function addComment(
  taskId: string,
  content: string,
  author: User = MOCK_CURRENT_USER
): Promise<TaskComment> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const newComment: TaskComment = {
    id: `comm-${Date.now()}`,
    taskId,
    author,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  const list = commentsStorage[taskId] || [];
  commentsStorage[taskId] = [newComment, ...list];
  return newComment;
}

/**
 * Delete a comment from a task
 */
export async function deleteComment(
  taskId: string,
  commentId: string
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const list = commentsStorage[taskId] || [];
  const filtered = list.filter((c) => c.id !== commentId);
  commentsStorage[taskId] = filtered;
  return filtered.length < list.length;
}
