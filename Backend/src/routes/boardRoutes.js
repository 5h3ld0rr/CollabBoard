import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../schemas/commonSchema.js';
import { createBoardSchema, updateBoardSchema } from '../schemas/boardSchema.js';
import { taskQuerySchema } from '../schemas/taskSchema.js';
import * as controller from '../controllers/boardController.js';
import * as taskController from '../controllers/taskController.js';

const router = Router();

// Protect all board routes with authentication
router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.post('/', validate(createBoardSchema, 'body'), asyncHandler(controller.create));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.getOne));
router.get(
  '/:id/tasks',
  validate(idParamSchema, 'params'),
  validate(taskQuerySchema, 'query'),
  asyncHandler(taskController.listByBoard)
);
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateBoardSchema, 'body'),
  asyncHandler(controller.update)
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.remove));

export default router;
