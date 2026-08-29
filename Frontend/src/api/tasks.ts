import { request } from './client';
import type { Task, TaskStatus, TaskComment, User } from '../types';

export interface TaskListResponse {
  data: Task[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface TaskResponse {
  data: Task;
}

const DEFAULT_COMMENT_AUTHOR: User = {
  id: 'usr-current',
  name: 'Team Member',
  email: 'member@collabboard.io',
  initials: 'TM',
  color: 'bg-indigo-600',
};

const commentsStorage: Record<string, TaskComment[]> = {};

/**
 * Fetch all tasks, optionally filtered by board ID and query parameters
 */
export async function getTasks(boardId?: string, params?: Record<string, string>): Promise<Task[]> {
  const queryParams = new URLSearchParams(params || {});
  if (boardId) {
    queryParams.set('boardId', boardId);
  }
  const queryString = queryParams.toString();
  const url = '/api/tasks' + (queryString ? `?${queryString}` : '');
  const res = await request<TaskListResponse>(url);
  return res.data || [];
}

/**
 * Fetch tasks for a specific board using the nested endpoint
 */
export async function getBoardTasks(boardId: string, params?: Record<string, string>): Promise<Task[]> {
  const queryParams = new URLSearchParams(params || {});
  const queryString = queryParams.toString();
  const url = `/api/boards/${boardId}/tasks` + (queryString ? `?${queryString}` : '');
  const res = await request<TaskListResponse>(url);
  return res.data || [];
}

/**
 * Fetch a single task by its ID
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const res = await request<TaskResponse>(`/api/tasks/${taskId}`);
    return res.data || null;
  } catch {
    return null;
  }
}

/**
 * Create a new task in a board
 */
export async function createTask(
  boardId: string,
  taskInput: Partial<Task> & { title: string }
): Promise<Task> {
  const payload = {
    ...taskInput,
    boardId,
  };
  const res = await request<TaskResponse>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<Task> {
  const res = await request<TaskResponse>(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return res.data;
}

/**
 * Update task status (e.g. todo -> doing -> done)
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
  await request(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });
  return true;
}

/**
 * Fetch comments for a task
 */
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  return commentsStorage[taskId] || [];
}

/**
 * Add comment to task
 */
export async function addComment(
  taskId: string,
  content: string,
  author: User = DEFAULT_COMMENT_AUTHOR
): Promise<TaskComment> {
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
 * Delete a comment from task
 */
export async function deleteComment(taskId: string, commentId: string): Promise<boolean> {
  const list = commentsStorage[taskId] || [];
  const filtered = list.filter((c) => c.id !== commentId);
  commentsStorage[taskId] = filtered;
  return filtered.length < list.length;
}
