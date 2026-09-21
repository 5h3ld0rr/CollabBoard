import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';
import { sessionRepo } from '../repos/sessionRepo.js';

/**
 * Middleware to verify JWT token from Authorization header or HTTP-only cookie
 * and attach user payload to req.user
 */
export async function authenticate(req, res, next) {
  let token = null;

  if (req.headers.authorization) {
    const [scheme, val] = req.headers.authorization.split(' ');
    if (scheme === 'Bearer') {
      token = val;
    }
  }

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('Authentication required', 401, 'NO_TOKEN'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.sessionId) {
      const isRevoked = await sessionRepo.isSessionRevoked(payload.sessionId);
      if (isRevoked) {
        return next(new AppError('Session has been revoked', 401, 'SESSION_REVOKED'));
      }
      sessionRepo.updateLastActive(payload.sessionId);
    }
    req.user = { id: payload.sub, email: payload.email, sessionId: payload.sessionId };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    const expired = err.name === 'TokenExpiredError';
    next(
      new AppError(
        expired ? 'Token expired' : 'Invalid token',
        401,
        expired ? 'TOKEN_EXPIRED' : 'BAD_TOKEN'
      )
    );
  }
}

