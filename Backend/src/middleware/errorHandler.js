import fs from 'node:fs';
import path from 'node:path';
import { NotFoundError } from '../utils/AppError.js';

const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export function errorHandler(err, req, res, next) {
  // Handle MongoDB duplicate key error (11000)
  if (err.code === 11000 || String(err.code) === '11000') {
    return res.status(409).json({
      error: {
        message: 'Email already registered',
        code: 'EMAIL_EXISTS',
        requestId: req?.id,
      },
    });
  }

  // Handle Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(404).json({
      error: {
        message: 'Resource not found',
        code: 'NOT_FOUND',
        requestId: req?.id,
      },
    });
  }

  const status = err.status ?? 500;
  const errorObj = {
    message: status === 500 ? 'Something went wrong' : err.message,
    code: err.code ?? 'INTERNAL_ERROR',
    requestId: req?.id,
  };

  if (err.details) {
    errorObj.details = err.details;
  }

  if (status >= 500) {
    const errorLogLine = `[${new Date().toISOString()}] ERROR ${req?.method || ''} ${req?.originalUrl || ''} [${
      req?.id || ''
    }]: ${err.stack || err.message}\n`;
    console.error(errorLogLine.trim());
    fs.promises.appendFile(path.join(logsDir, 'error.log'), errorLogLine).catch(() => {});
  }

  res.status(status).json({ error: errorObj });
}

export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}
