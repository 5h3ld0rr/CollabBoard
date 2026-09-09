import * as authService from '../services/authService.js';
import { config } from '../config.js';

/**
 * Build cookie configuration.
 * - Default: Session cookie (no maxAge/expires)
 * - Remember Me: 30-day persistent cookie
 */
function getCookieOptions(rememberMe = false) {
  const options = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
  };

  if (rememberMe) {
    options.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  }

  return options;
}

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json({
    ...result,
    data: result,
  });
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.cookie('token', result.token, getCookieOptions(result.rememberMe));
  res.status(200).json({
    ...result,
    data: result,
  });
}

export async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.status(200).json({
    message: 'Logged out successfully',
  });
}

export async function getMe(req, res) {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({
    data: { user },
  });
}
