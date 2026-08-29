import { z } from 'zod';

/**
 * Common schema for validating resource ID URL parameter (:id)
 */
export const idParamSchema = z.object({
  id: z.string().trim().min(1, 'ID parameter is required'),
});

/**
 * Common schema for validating pagination & sorting query parameters
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional().default('-createdAt'),
});
