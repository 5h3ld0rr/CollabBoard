import * as authService from '../services/authService.js';

export async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json({
    data: result,
  });
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  res.status(200).json({
    data: result,
  });
}

export async function getMe(req, res) {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({
    data: { user },
  });
}
