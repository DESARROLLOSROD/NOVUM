import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Category from '../models/Category';
import logger from '../config/logger';

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Private
 */
export const getCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json({
            success: true,
            data: categories
        });
    } catch (error: any) {
        logger.error('Error getting categories:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías',
            error: error.message
        });
    }
};

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private
 */
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { code, name, parent } = req.body;

        // Check if code already exists
        const existingCode = await Category.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            res.status(400).json({
                success: false,
                message: 'El código de la categoría ya existe'
            });
            return;
        }

        const category = await Category.create({
            code: code.toUpperCase(),
            name,
            parent: parent || null,
            path: code, // Initial path, will be updated by pre-save hook if parent exists
            isActive: true
        });

        logger.info(`Category created: ${code} by ${req.user?.email}`);

        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: category
        });
    } catch (error: any) {
        logger.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear categoría',
            error: error.message
        });
    }
};
