import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { getCategories, createCategory } from '../controllers/categoryController';

const router = Router();

router.use(protect);
router.get('/', getCategories);
router.post('/', authorize('admin', 'purchasing'), createCategory);

export default router;
