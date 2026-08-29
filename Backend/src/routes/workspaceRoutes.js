import { Router } from 'express';
import * as workspaceController from '../controllers/workspaceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../schemas/workspaceSchema.js';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

router.get('/', workspaceController.list);
router.get('/:id', workspaceController.getById);
router.post('/', validate(createWorkspaceSchema), workspaceController.create);
router.patch('/:id', validate(updateWorkspaceSchema), workspaceController.update);
router.delete('/:id', workspaceController.remove);

export default router;
