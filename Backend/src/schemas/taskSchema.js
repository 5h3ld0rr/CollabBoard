import { z } from 'zod';

/**
 * Validation schema for Task Creation
 */
export const createTaskSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().optional().default(''),
  status: z.enum(['todo', 'doing', 'done']).default('todo'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  assignee: z.string().trim().optional().default(''),
  boardId: z.string().trim().min(1, 'boardId is required'),
  dueDate: z.string().optional(),
});

/**
 * Validation schema for Task Updates
 */
export const updateTaskSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().trim().optional(),
  status: z.enum(['todo', 'doing', 'done']).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  assignee: z.string().trim().optional(),
  boardId: z.string().trim().optional(),
  dueDate: z.string().optional(),
});

/**
 * Validation schema for Task Status Transitions
 */
export const moveTaskStatusSchema = z.object({
  status: z.enum(['todo', 'doing', 'done']),
});

/**
 * Validation schema for Task Query parameters (filtering, sorting, pagination)
 */
export const taskQuerySchema = z.object({
  status: z.enum(['todo', 'doing', 'done']).optional(),
  assignee: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  boardId: z.string().optional(),
  sort: z.string().optional().default('-createdAt'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
