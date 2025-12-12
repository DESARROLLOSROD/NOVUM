import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getCategories } from '../controllers/categoryController';

const router = Router();

router.use(protect);
router.get('/', getCategories);

export default router;
