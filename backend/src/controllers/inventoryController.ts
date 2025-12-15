import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

/**
 * @desc    Get inventory items
 * @route   GET /api/inventory
 * @access  Private (Admin gets all, others get their department's inventory)
 */
export const getInventory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const filter: any = {};

    // If user is not an admin, restrict to their department
    if (user.role !== 'admin') {
      const userDoc = await User.findById(user.id);
      if (!userDoc || !userDoc.department) {
        throw new AppError('No tienes un departamento asignado.', 400);
      }
      filter.department = userDoc.department;
    }

    const inventoryItems = await Inventory.find(filter)
      .populate('product', 'name code unitOfMeasure')
      .populate('department', 'name code')
      .populate('lastUpdatedBy', 'firstName lastName');

    res.json({
      success: true,
      data: inventoryItems,
    });
  } catch (error) {
    logger.error('Error getting inventory:', error);
    next(error);
  }
};

/**
 * @desc    Add a new item to the inventory
 * @route   POST /api/inventory
 * @access  Private (Admin, Purchasing)
 */
export const addInventoryItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { product, department, quantity, location } = req.body;
    const user = req.user!;

    // Check if item already exists for the department
    const existingItem = await Inventory.findOne({ product, department });
    if (existingItem) {
      throw new AppError('Este producto ya existe en el inventario del departamento.', 400);
    }

    const newItem = await Inventory.create({
      product,
      department,
      quantity,
      location,
      lastUpdatedBy: user.id,
    });

    const populatedItem = await Inventory.findById(newItem._id)
      .populate('product', 'name code')
      .populate('department', 'name code');

    logger.info(`Inventory item added: ${populatedItem?.product.code} to dept ${populatedItem?.department.code} by ${user.email}`);

    res.status(201).json({
      success: true,
      data: populatedItem,
    });
  } catch (error) {
    logger.error('Error adding inventory item:', error);
    next(error);
  }
};

/**
 * @desc    Update inventory quantity for an item
 * @route   PUT /api/inventory/:id
 * @access  Private (Admin, or user from the same department)
 */
export const updateInventoryQuantity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, location } = req.body;
    const user = req.user!;

    if (quantity === undefined) {
      throw new AppError('La cantidad es requerida.', 400);
    }

    const item = await Inventory.findById(id);

    if (!item) {
      throw new AppError('Artículo de inventario no encontrado.', 404);
    }

    // Authorization check: allow if admin or if user is in the same department
    if (user.role !== 'admin') {
      const userDoc = await User.findById(user.id);
      if (userDoc?.department?.toString() !== item.department.toString()) {
        throw new AppError('No tienes permisos para modificar el inventario de este departamento.', 403);
      }
    }

    item.quantity = quantity;
    item.lastUpdatedBy = new mongoose.Types.ObjectId(user.id);
    if (location) {
        item.location = location;
    }

    await item.save();

    const populatedItem = await Inventory.findById(item._id)
      .populate('product', 'name code')
      .populate('department', 'name code')
      .populate('lastUpdatedBy', 'firstName lastName');

    logger.info(`Inventory item updated: ${populatedItem?.product.code} in dept ${populatedItem?.department.code} by ${user.email}`);

    res.json({
      success: true,
      data: populatedItem,
    });
  } catch (error) {
    logger.error('Error updating inventory quantity:', error);
    next(error);
  }
};
