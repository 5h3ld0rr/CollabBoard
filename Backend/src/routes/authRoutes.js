import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/authLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema } from '../schemas/authSchema.js';
import * as controller from '../controllers/authController.js';

const router = Router();

router.post('/register', validate(registerSchema, 'body'), asyncHandler(controller.register));
router.post('/login', authRateLimiter, validate(loginSchema, 'body'), asyncHandler(controller.login));
router.post('/logout', asyncHandler(controller.logout));
router.get('/me', authenticate, asyncHandler(controller.getMe));
router.patch('/me', authenticate, validate(updateProfileSchema, 'body'), asyncHandler(controller.updateProfile));
router.patch('/profile', authenticate, validate(updateProfileSchema, 'body'), asyncHandler(controller.updateProfile));
router.put('/password', authenticate, validate(updatePasswordSchema, 'body'), asyncHandler(controller.updatePassword));
router.patch('/password', authenticate, validate(updatePasswordSchema, 'body'), asyncHandler(controller.updatePassword));

export default router;
