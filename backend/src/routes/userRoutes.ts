import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
} from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.put('/:id/reset-password', authorize('admin'), resetUserPassword);

// Admin and managers can view users
router.get('/', authorize('admin', 'finance', 'purchasing'), getUsers);
router.get('/:id', authorize('admin', 'finance', 'purchasing'), getUser);

export default router;
