import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registerSchema, loginSchema } from '../schemas/authSchema.js';
import * as controller from '../controllers/authController.js';

const router = Router();

router.post('/register', validate(registerSchema, 'body'), asyncHandler(controller.register));
router.post('/login', validate(loginSchema, 'body'), asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.getMe));

export default router;
