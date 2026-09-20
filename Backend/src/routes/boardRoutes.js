import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { idParamSchema } from '../schemas/commonSchema.js';
import {
  createBoardSchema,
  updateBoardSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  createShareTokenSchema,
} from '../schemas/boardSchema.js';
import { taskQuerySchema } from '../schemas/taskSchema.js';
import * as controller from '../controllers/boardController.js';
import * as taskController from '../controllers/taskController.js';

const router = Router();

// Middleware allowing temporary shareToken to view board & tasks without login
function authenticateOrShareToken(req, res, next) {
  if (req.query.shareToken || req.headers['x-share-token']) {
    req.user = { id: 'guest', isGuest: true };
    return next();
  }
  return authenticate(req, res, next);
}

router.get('/', authenticate, asyncHandler(controller.list));
router.post('/', authenticate, validate(createBoardSchema, 'body'), asyncHandler(controller.create));
router.get('/:id', authenticateOrShareToken, validate(idParamSchema, 'params'), asyncHandler(controller.getOne));
router.get(
  '/:id/analytics',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getAnalytics)
);
router.get(
  '/:id/tasks',
  authenticateOrShareToken,
  validate(idParamSchema, 'params'),
  validate(taskQuerySchema, 'query'),
  asyncHandler(taskController.listByBoard)
);
router.get(
  '/:id/share-token',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(controller.getActiveShareToken)
);
router.post(
  '/:id/share-token',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(createShareTokenSchema, 'body'),
  asyncHandler(controller.generateShareToken)
);
router.post(
  '/:id/share-token/reset',
  authenticate,
  validate(idParamSchema, 'params'),
  asyncHandler(controller.resetShareToken)
);
router.post(
  '/:id/members',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(addMemberSchema, 'body'),
  asyncHandler(controller.addMember)
);
router.delete(
  '/:id/members/:memberId',
  authenticate,
  asyncHandler(controller.removeMember)
);
router.patch(
  '/:id/members/:memberId',
  authenticate,
  validate(updateMemberRoleSchema, 'body'),
  asyncHandler(controller.updateMemberRole)
);
router.patch(
  '/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(updateBoardSchema, 'body'),
  asyncHandler(controller.update)
);
router.delete('/:id', authenticate, validate(idParamSchema, 'params'), asyncHandler(controller.remove));

export default router;
