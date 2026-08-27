import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../schemas/commonSchema.js';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '../schemas/taskSchema.js';
import * as controller from '../controllers/taskController.js';

const router = Router();

// Protect all task endpoints with authentication
router.use(authenticate);

router.get('/', validate(taskQuerySchema, 'query'), asyncHandler(controller.list));
router.post('/', validate(createTaskSchema, 'body'), asyncHandler(controller.create));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.getOne));
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateTaskSchema, 'body'),
  asyncHandler(controller.update)
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.remove));

export default router;
