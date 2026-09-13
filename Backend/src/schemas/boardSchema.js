import { z } from 'zod';

/**
 * Validation schema for Board Creation
 */
export const createBoardSchema = z.object({
  title: z.string().trim().min(3, 'Board title must be at least 3 characters'),
  description: z.string().trim().optional().default(''),
  members: z.array(z.union([z.string(), z.object({ id: z.string() }).passthrough()])).optional().default([]),
  color: z.string().optional(),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  workspaceId: z.string().optional(),
  workspaceName: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

/**
 * Validation schema for Board Updates
 */
export const updateBoardSchema = z.object({
  title: z.string().trim().min(3, 'Board title must be at least 3 characters').optional(),
  description: z.string().trim().optional(),
  members: z.array(z.union([z.string(), z.object({ id: z.string() }).passthrough()])).optional(),
  memberRoles: z.record(z.string(), z.string()).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  tags: z.array(z.string()).optional(),
  workspaceId: z.string().optional(),
  workspaceName: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

/**
 * Validation schema for Adding Member to Board
 */
export const addMemberSchema = z.object({
  userId: z.string().trim().min(1, 'userId is required'),
  role: z.enum(['Admin', 'Editor', 'Viewer', 'Member'], {
    errorMap: () => ({ message: 'Invalid board member role' }),
  }).optional(),
});

/**
 * Validation schema for Updating Member Role
 */
export const updateMemberRoleSchema = z.object({
  role: z.enum(['Admin', 'Editor', 'Viewer'], {
    errorMap: () => ({ message: 'Invalid role. Role must be Admin, Editor, or Viewer' }),
  }),
});
