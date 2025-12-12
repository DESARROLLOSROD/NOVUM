import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplierController';

const router = Router();

// All routes require authentication
router.use(protect);

// All authenticated users can view suppliers
router.get('/', getSuppliers);
router.get('/:id', getSupplier);

// Admin and purchasing can create/update
router.post('/', authorize('admin', 'purchasing'), createSupplier);
router.put('/:id', authorize('admin', 'purchasing'), updateSupplier);

// Admin only delete
router.delete('/:id', authorize('admin'), deleteSupplier);

export default router;
