import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController';

const router = Router();

// All routes require authentication
router.use(protect);

// All authenticated users can view departments
router.get('/', getDepartments);
router.get('/:id', getDepartment);

// Admin only for create/update/delete
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

export default router;
