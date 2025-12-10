import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updatePassword,
} from '../controllers/authController';
import { protect, authorize } from '../middleware/auth';
import { loginValidation, createUserValidation } from '../middleware/validator';
import { loginLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authorize('admin'), createUserValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

export default router;
