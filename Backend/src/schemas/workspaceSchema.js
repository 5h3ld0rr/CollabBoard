import { z } from 'zod';

/**
 * Validation schema for Workspace Creation
 */
export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Workspace name must be at least 2 characters'),
  description: z.string().trim().optional().default(''),
  color: z.string().optional(),
  admins: z.array(z.string()).optional().default([]),
  members: z.array(z.string()).optional().default([]),
});

/**
 * Validation schema for Workspace Updates
 */
export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Workspace name must be at least 2 characters').optional(),
  description: z.string().trim().optional(),
  color: z.string().optional(),
  admins: z.array(z.string()).optional(),
  members: z.array(z.string()).optional(),
});
