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
