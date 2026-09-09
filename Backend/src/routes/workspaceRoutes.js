import { Router } from 'express';
import * as workspaceController from '../controllers/workspaceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../schemas/commonSchema.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../schemas/workspaceSchema.js';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(workspaceController.list));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(workspaceController.getById));
router.post('/', validate(createWorkspaceSchema), asyncHandler(workspaceController.create));
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateWorkspaceSchema), asyncHandler(workspaceController.update));
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(workspaceController.remove));

export default router;
