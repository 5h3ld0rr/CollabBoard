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

export interface CommentListResponse {
  data: TaskComment[];
}

export interface CommentResponse {
  data: TaskComment;
}

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
 * Fetch comments for a task from backend API
 */
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  try {
    const res = await request<CommentListResponse>(`/api/tasks/${taskId}/comments`);
    return res.data || [];
  } catch {
    return [];
  }
}

/**
 * Add comment to task via backend API
 */
export async function addComment(
  taskId: string,
  content: string,
  _author?: User
): Promise<TaskComment> {
  const res = await request<CommentResponse>(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: content.trim() }),
  });
  return res.data;
}

/**
 * Delete a comment from task via backend API
 */
export async function deleteComment(taskId: string, commentId: string): Promise<boolean> {
  try {
    await request(`/api/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
}
