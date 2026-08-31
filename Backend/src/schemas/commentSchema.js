import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters'),
});
