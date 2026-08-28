import { AppError } from '../utils/AppError.js';

const ipAttempts = new Map();

/**
 * In-memory rate limiter for authentication endpoints.
 * Enforces a cap of 5 login attempts per IP per minute to prevent brute-force attacks (Slide 57).
 */
export function authRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_ATTEMPTS = 5;

  const record = ipAttempts.get(ip) || { count: 0, resetTime: now + WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + WINDOW_MS;
  } else {
    record.count += 1;
  }

  ipAttempts.set(ip, record);

  if (record.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return next(
      new AppError(
        'Too many login attempts from this IP. Please try again after a minute.',
        429,
        'RATE_LIMIT_EXCEEDED',
        { retryAfterSeconds: retryAfter }
      )
    );
  }

  next();
}
