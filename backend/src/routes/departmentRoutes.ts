import express from 'express';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router
  .route('/')
  .post(protect, authorize('admin'), createDepartment)
  .get(protect, getDepartments);

router
  .route('/:id')
  .get(protect, getDepartmentById)
  .put(protect, authorize('admin'), updateDepartment)
  .delete(protect, authorize('admin'), deleteDepartment);

export default router;
