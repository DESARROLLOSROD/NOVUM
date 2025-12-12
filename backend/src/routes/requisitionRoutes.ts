import { Router } from 'express';
import {
  createRequisition,
  getRequisitions,
  getRequisitionById,
  approveRequisition,
  rejectRequisition,
  cancelRequisition,
  exportRequisitionToPdf,
  exportRequisitionToExcel,
  exportRequisitionsToExcel,
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
  authorize('requester', 'admin'),
  idValidation,
  cancelRequisition
);

// Rutas de exportación
router.get('/export/excel', exportRequisitionsToExcel);

router.get('/:id/export/pdf', idValidation, exportRequisitionToPdf);

router.get('/:id/export/excel', idValidation, exportRequisitionToExcel);

export default router;
