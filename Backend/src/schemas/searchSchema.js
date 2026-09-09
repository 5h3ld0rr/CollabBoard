import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().optional().default(''),
  type: z.enum(['all', 'workspaces', 'boards', 'tasks']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});
