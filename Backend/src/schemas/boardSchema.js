import { z } from 'zod';

/**
 * Validation schema for Board Creation
 */
export const createBoardSchema = z.object({
  title: z.string().trim().min(3, 'Board title must be at least 3 characters'),
  description: z.string().trim().optional().default(''),
  members: z.array(z.string()).optional().default([]),
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
  members: z.array(z.string()).optional(),
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
});
