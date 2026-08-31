import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../schemas/commonSchema.js';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskStatusSchema,
  taskQuerySchema,
} from '../schemas/taskSchema.js';
import * as controller from '../controllers/taskController.js';
import * as commentController from '../controllers/commentController.js';
import { createCommentSchema } from '../schemas/commentSchema.js';

const router = Router();

// Protect all task endpoints with authentication
router.use(authenticate);

router.get('/', validate(taskQuerySchema, 'query'), asyncHandler(controller.list));
router.post('/', validate(createTaskSchema, 'body'), asyncHandler(controller.create));
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.getOne));
router.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(moveTaskStatusSchema, 'body'),
  asyncHandler(controller.moveStatus)
);
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateTaskSchema, 'body'),
  asyncHandler(controller.update)
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.remove));

/* Nested Task Comments Routes */
router.get('/:id/comments', validate(idParamSchema, 'params'), asyncHandler(commentController.list));
router.post(
  '/:id/comments',
  validate(idParamSchema, 'params'),
  validate(createCommentSchema, 'body'),
  asyncHandler(commentController.create)
);
router.delete('/:id/comments/:commentId', asyncHandler(commentController.remove));

export default router;
