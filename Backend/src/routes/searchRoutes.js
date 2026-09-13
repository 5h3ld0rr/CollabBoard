import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { searchQuerySchema } from '../schemas/searchSchema.js';
import * as controller from '../controllers/searchController.js';

const router = Router();

// Protect search route with authentication
router.use(authenticate);

router.get('/', validate(searchQuerySchema, 'query'), asyncHandler(controller.search));

export default router;
