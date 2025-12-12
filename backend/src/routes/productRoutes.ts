import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts
} from '../controllers/productController';

const router = Router();

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', getProducts);
router.get('/alerts/low-stock', getLowStockProducts);
router.get('/:id', getProduct);

// Admin and purchasing can create/update
router.post('/', authorize('admin', 'purchasing'), createProduct);
router.put('/:id', authorize('admin', 'purchasing'), updateProduct);

// Admin only delete
router.delete('/:id', authorize('admin'), deleteProduct);

// Warehouse and admin can update stock
router.put('/:id/stock', authorize('admin', 'warehouse'), updateStock);

export default router;
