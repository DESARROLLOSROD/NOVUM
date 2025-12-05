import { Router } from 'express';
import {
  createRequisition,
  getRequisitions,
  getRequisitionById,
  approveRequisition,
  rejectRequisition,
  cancelRequisition,
} from '../controllers/requisitionController';
import { protect, authorize } from '../middleware/auth';
import { createRequisitionValidation, idValidation, paginationValidation } from '../middleware/validator';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);

router.post(
  '/',
  authorize('requester', 'admin'),
  createLimiter,
  createRequisitionValidation,
  createRequisition
);

router.get('/', paginationValidation, getRequisitions);

router.get('/:id', idValidation, getRequisitionById);

router.post(
  '/:id/approve',
  authorize('approver', 'finance', 'admin'),
  idValidation,
  approveRequisition
);

router.post(
  '/:id/reject',
  authorize('approver', 'finance', 'admin'),
  idValidation,
  rejectRequisition
);

router.post(
  '/:id/cancel',
  idValidation,
  cancelRequisition
);

export default router;
