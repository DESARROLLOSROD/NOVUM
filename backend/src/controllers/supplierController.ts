import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Supplier from '../models/Supplier';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * @desc    Get all suppliers
 * @route   GET /api/suppliers
 * @access  Private
 */
export const getSuppliers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, isActive, search } = req.query;

    const filter: any = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } },
        { taxId: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(filter)
      .sort({ businessName: 1 });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    logger.error('Error getting suppliers:', error);
    next(error);
  }
};

/**
 * @desc    Get single supplier
 * @route   GET /api/suppliers/:id
 * @access  Private
 */
export const getSupplier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      throw new AppError('Proveedor no encontrado', 404);
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    logger.error('Error getting supplier:', error);
    next(error);
  }
};

/**
 * @desc    Create supplier
 * @route   POST /api/suppliers
 * @access  Private (Admin, Purchasing)
 */
export const createSupplier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      supplierCode,
      businessName,
      taxId,
      contactName,
      email,
      phone,
      address,
      category,
      paymentTerms,
      deliveryTime
    } = req.body;

    // Check if code already exists
    const existingCode = await Supplier.findOne({ supplierCode: supplierCode.toUpperCase() });
    if (existingCode) {
      throw new AppError('El código del proveedor ya existe', 400);
    }

    // Check if taxId already exists
    if (taxId) {
      const existingTaxId = await Supplier.findOne({ taxId });
      if (existingTaxId) {
        throw new AppError('El RFC/Tax ID ya está registrado', 400);
      }
    }

    const supplier = await Supplier.create({
      supplierCode: supplierCode.toUpperCase(),
      businessName,
      taxId,
      contactName,
      email,
      phone,
      address,
      category: category || 'General',
      paymentTerms: paymentTerms || 'Contado',
      deliveryTime: deliveryTime || 0,
      rating: 3,
      isActive: true
    });

    logger.info(`Supplier created: ${supplierCode} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: supplier
    });
  } catch (error) {
    logger.error('Error creating supplier:', error);
    next(error);
  }
};

/**
 * @desc    Update supplier
 * @route   PUT /api/suppliers/:id
 * @access  Private (Admin, Purchasing)
 */
export const updateSupplier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      throw new AppError('Proveedor no encontrado', 404);
    }

    // Check if code is being changed
    if (updateData.supplierCode && updateData.supplierCode.toUpperCase() !== supplier.supplierCode) {
      const existingCode = await Supplier.findOne({ supplierCode: updateData.supplierCode.toUpperCase() });
      if (existingCode) {
        throw new AppError('El código del proveedor ya existe', 400);
      }
      updateData.supplierCode = updateData.supplierCode.toUpperCase();
    }

    // Check if taxId is being changed
    if (updateData.taxId && updateData.taxId !== supplier.taxId) {
      const existingTaxId = await Supplier.findOne({ taxId: updateData.taxId });
      if (existingTaxId) {
        throw new AppError('El RFC/Tax ID ya está registrado', 400);
      }
    }

    Object.assign(supplier, updateData);
    await supplier.save();

    logger.info(`Supplier updated: ${supplier.supplierCode} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: supplier
    });
  } catch (error) {
    logger.error('Error updating supplier:', error);
    next(error);
  }
};

/**
 * @desc    Delete supplier (soft delete)
 * @route   DELETE /api/suppliers/:id
 * @access  Private (Admin only)
 */
export const deleteSupplier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      throw new AppError('Proveedor no encontrado', 404);
    }

    supplier.isActive = false;
    await supplier.save();

    logger.info(`Supplier deactivated: ${supplier.supplierCode} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Proveedor desactivado exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting supplier:', error);
    next(error);
  }
};
