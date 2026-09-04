export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export class NotFoundError extends AppError {
  constructor(what = 'Resource') {
    super(`${what} not found`, 404, 'NOT_FOUND');
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('You may not do that', 403, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(details) {
    super('Validation failed', 400, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict: Resource has been modified by another user', details) {
    super(message, 409, 'CONFLICT', details);
  }
}

