import express from 'express';
import { getInventory, addInventoryItem, updateInventoryQuantity } from '../controllers/inventoryController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/inventory
// @desc    Get inventory items for the user's department, or all if admin
// @access  Private
router.route('/').get(protect, getInventory);

// @route   POST /api/inventory
// @desc    Add a new item to a department's inventory
// @access  Private (Admin, Purchasing)
router.route('/').post(protect, authorize('admin', 'purchasing'), addInventoryItem);

// @route   PUT /api/inventory/:id
// @desc    Update an inventory item's quantity or location
// @access  Private
router.route('/:id').put(protect, updateInventoryQuantity);

export default router;
