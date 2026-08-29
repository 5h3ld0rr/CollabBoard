import { ValidationError } from '../utils/AppError.js';

/**
 * Generic Zod validation middleware.
 * Validates req[source] (default: 'body', or 'query', 'params') against the provided Zod schema.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against.
 * @param {'body' | 'query' | 'params'} [source='body'] - Request property to validate.
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || source,
      message: issue.message,
    }));
    return next(new ValidationError(details));
  }

  if (source === 'body') {
    req.body = result.data;
  } else {
    req.validated = req.validated ?? {};
    req.validated[source] = result.data;
  }

  next();
};
