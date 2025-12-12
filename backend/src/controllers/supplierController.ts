import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Supplier from '../models/Supplier';
import logger from '../config/logger';

/**
 * @desc    Get all suppliers
 * @route   GET /api/suppliers
 * @access  Private
 */
export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, isActive, search } = req.query;

    const filter: any = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { taxId: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(filter)
      .sort({ name: 1 });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error: any) {
    logger.error('Error getting suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

/**
 * @desc    Get single supplier
 * @route   GET /api/suppliers/:id
 * @access  Private
 */
export const getSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error: any) {
    logger.error('Error getting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

/**
 * @desc    Create supplier
 * @route   POST /api/suppliers
 * @access  Private (Admin, Purchasing)
 */
export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      name,
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
    const existingCode = await Supplier.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      res.status(400).json({
        success: false,
        message: 'El código del proveedor ya existe'
      });
      return;
    }

    // Check if taxId already exists
    if (taxId) {
      const existingTaxId = await Supplier.findOne({ taxId });
      if (existingTaxId) {
        res.status(400).json({
          success: false,
          message: 'El RFC/Tax ID ya está registrado'
        });
        return;
      }
    }

    const supplier = await Supplier.create({
      code: code.toUpperCase(),
      name,
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

    logger.info(`Supplier created: ${code} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: supplier
    });
  } catch (error: any) {
    logger.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

/**
 * @desc    Update supplier
 * @route   PUT /api/suppliers/:id
 * @access  Private (Admin, Purchasing)
 */
export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
      return;
    }

    // Check if code is being changed
    if (updateData.code && updateData.code.toUpperCase() !== supplier.code) {
      const existingCode = await Supplier.findOne({ code: updateData.code.toUpperCase() });
      if (existingCode) {
        res.status(400).json({
          success: false,
          message: 'El código del proveedor ya existe'
        });
        return;
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Check if taxId is being changed
    if (updateData.taxId && updateData.taxId !== supplier.taxId) {
      const existingTaxId = await Supplier.findOne({ taxId: updateData.taxId });
      if (existingTaxId) {
        res.status(400).json({
          success: false,
          message: 'El RFC/Tax ID ya está registrado'
        });
        return;
      }
    }

    Object.assign(supplier, updateData);
    await supplier.save();

    logger.info(`Supplier updated: ${supplier.code} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: supplier
    });
  } catch (error: any) {
    logger.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

/**
 * @desc    Delete supplier (soft delete)
 * @route   DELETE /api/suppliers/:id
 * @access  Private (Admin only)
 */
export const deleteSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
      return;
    }

    supplier.isActive = false;
    await supplier.save();

    logger.info(`Supplier deactivated: ${supplier.code} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Proveedor desactivado exitosamente'
    });
  } catch (error: any) {
    logger.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar proveedor',
      error: error.message
    });
  }
};
