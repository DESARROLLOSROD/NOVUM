import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';
import Category from '../models/Category';
import Supplier from '../models/Supplier';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Private
 */
export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, supplier, isActive, search, stockStatus } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Build filter
    const filter: any = {};

    if (category) filter.category = category;
    if (supplier) {
      filter.$or = [
        { preferredSupplier: supplier },
        { alternativeSuppliers: supplier }
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('category', 'name code')
      .populate('preferredSupplier', 'name code')
      .populate('createdBy', 'firstName lastName email')
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    // Filter by stock status if requested
    let filteredProducts = products;
    if (stockStatus) {
      filteredProducts = products.filter(p => {
        const pObj = p.toObject();
        return pObj.stockStatus === stockStatus;
      });
    }

    res.json({
      success: true,
      data: filteredProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting products:', error);
    next(error);
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Private
 */
export const getProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('preferredSupplier')
      .populate('alternativeSuppliers')
      .populate('createdBy', 'firstName lastName email');

    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Error getting product:', error);
    next(error);
  }
};

/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Private (Admin, Purchasing)
 */
export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      code,
      name,
      description,
      category,
      unitOfMeasure,
      unitPrice,
      currency,
      minStock,
      maxStock,
      currentStock,
      reorderPoint,
      preferredSupplier,
      alternativeSuppliers,
      specifications
    } = req.body;

    // Check if code already exists
    const existingProduct = await Product.findOne({ code: code.toUpperCase() });
    if (existingProduct) {
      throw new AppError('El código del producto ya existe', 400);
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new AppError('La categoría no existe', 400);
    }

    // Verify supplier if provided
    if (preferredSupplier) {
      const supplierExists = await Supplier.findById(preferredSupplier);
      if (!supplierExists) {
        throw new AppError('El proveedor preferido no existe', 400);
      }
    }

    const product = await Product.create({
      code: code.toUpperCase(),
      name,
      description,
      category,
      unitOfMeasure,
      unitPrice,
      currency: currency || 'MXN',
      minStock: minStock || 0,
      maxStock,
      currentStock: currentStock || 0,
      reorderPoint: reorderPoint || 0,
      preferredSupplier,
      alternativeSuppliers: alternativeSuppliers || [],
      specifications,
      isActive: true,
      createdBy: req.user!.id
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name code')
      .populate('preferredSupplier', 'name code')
      .populate('createdBy', 'firstName lastName email');

    logger.info(`Product created: ${code} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: populatedProduct
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Admin, Purchasing)
 */
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    // Check if code is being changed and if it's unique
    if (updateData.code && updateData.code.toUpperCase() !== product.code) {
      const existingCode = await Product.findOne({ code: updateData.code.toUpperCase() });
      if (existingCode) {
        throw new AppError('El código del producto ya existe', 400);
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Verify category if changing
    if (updateData.category && updateData.category !== product.category?.toString()) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        throw new AppError('La categoría no existe', 400);
      }
    }

    // Update product
    Object.assign(product, updateData);
    await product.save();

    const updatedProduct = await Product.findById(id)
      .populate('category', 'name code')
      .populate('preferredSupplier', 'name code')
      .populate('alternativeSuppliers', 'name code')
      .populate('createdBy', 'firstName lastName email');

    logger.info(`Product updated: ${product.code} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    next(error);
  }
};

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/products/:id
 * @access  Private (Admin only)
 */
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    product.isActive = false;
    await product.save();

    logger.info(`Product deactivated: ${product.code} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Producto desactivado exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    next(error);
  }
};

/**
 * @desc    Update product stock
 * @route   PUT /api/products/:id/stock
 * @access  Private (Warehouse, Admin)
 */
export const updateStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, operation } = req.body; // operation: 'add' | 'subtract' | 'set'

    if (!operation || !['add', 'subtract', 'set'].includes(operation)) {
      throw new AppError('Operación inválida. Use: add, subtract o set', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Producto no encontrado', 404);
    }

    const currentStock = product.currentStock || 0;

    switch (operation) {
      case 'add':
        product.currentStock = currentStock + quantity;
        break;
      case 'subtract':
        product.currentStock = Math.max(0, currentStock - quantity);
        break;
      case 'set':
        product.currentStock = quantity;
        break;
    }

    await product.save();

    logger.info(`Stock updated for product ${product.code}: ${operation} ${quantity} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: {
        code: product.code,
        name: product.name,
        previousStock: currentStock,
        currentStock: product.currentStock,
        stockStatus: product.toObject().stockStatus
      }
    });
  } catch (error) {
    logger.error('Error updating stock:', error);
    next(error);
  }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/products/alerts/low-stock
 * @access  Private
 */
export const getLowStockProducts = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: {
        $lte: ['$currentStock', '$reorderPoint']
      }
    })
      .populate('category', 'name code')
      .populate('preferredSupplier', 'name code')
      .sort({ currentStock: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    logger.error('Error getting low stock products:', error);
    next(error);
  }
};
