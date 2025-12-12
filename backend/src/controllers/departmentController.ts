import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Department from '../models/Department';
import User from '../models/User';
import logger from '../config/logger';

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Private
 */
export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive, search } = req.query;

    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { costCenter: { $regex: search, $options: 'i' } }
      ];
    }

    const departments = await Department.find(filter)
      .populate('manager', 'firstName lastName email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: departments
    });
  } catch (error: any) {
    logger.error('Error getting departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener departamentos',
      error: error.message
    });
  }
};

/**
 * @desc    Get single department
 * @route   GET /api/departments/:id
 * @access  Private
 */
export const getDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager', 'firstName lastName email employeeCode');

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Departamento no encontrado'
      });
      return;
    }

    // Get department users count
    const usersCount = await User.countDocuments({ department: department._id, isActive: true });

    res.json({
      success: true,
      data: {
        ...department.toObject(),
        usersCount
      }
    });
  } catch (error: any) {
    logger.error('Error getting department:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener departamento',
      error: error.message
    });
  }
};

/**
 * @desc    Create department
 * @route   POST /api/departments
 * @access  Private (Admin only)
 */
export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, name, costCenter, manager } = req.body;

    // Check if code already exists
    const existingCode = await Department.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      res.status(400).json({
        success: false,
        message: 'El código del departamento ya existe'
      });
      return;
    }

    // Verify manager if provided
    if (manager) {
      const managerExists = await User.findById(manager);
      if (!managerExists) {
        res.status(400).json({
          success: false,
          message: 'El manager no existe'
        });
        return;
      }
    }

    const department = await Department.create({
      code: code.toUpperCase(),
      name,
      costCenter,
      manager,
      isActive: true
    });

    const populatedDept = await Department.findById(department._id)
      .populate('manager', 'firstName lastName email');

    logger.info(`Department created: ${code} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'Departamento creado exitosamente',
      data: populatedDept
    });
  } catch (error: any) {
    logger.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear departamento',
      error: error.message
    });
  }
};

/**
 * @desc    Update department
 * @route   PUT /api/departments/:id
 * @access  Private (Admin only)
 */
export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const department = await Department.findById(id);
    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Departamento no encontrado'
      });
      return;
    }

    // Check if code is being changed
    if (updateData.code && updateData.code.toUpperCase() !== department.code) {
      const existingCode = await Department.findOne({ code: updateData.code.toUpperCase() });
      if (existingCode) {
        res.status(400).json({
          success: false,
          message: 'El código del departamento ya existe'
        });
        return;
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Verify manager if changing
    if (updateData.manager && updateData.manager !== department.manager?.toString()) {
      const managerExists = await User.findById(updateData.manager);
      if (!managerExists) {
        res.status(400).json({
          success: false,
          message: 'El manager no existe'
        });
        return;
      }
    }

    Object.assign(department, updateData);
    await department.save();

    const updatedDept = await Department.findById(id)
      .populate('manager', 'firstName lastName email');

    logger.info(`Department updated: ${department.code} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Departamento actualizado exitosamente',
      data: updatedDept
    });
  } catch (error: any) {
    logger.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar departamento',
      error: error.message
    });
  }
};

/**
 * @desc    Delete department (soft delete)
 * @route   DELETE /api/departments/:id
 * @access  Private (Admin only)
 */
export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Departamento no encontrado'
      });
      return;
    }

    // Check if department has active users
    const activeUsers = await User.countDocuments({ department: id, isActive: true });
    if (activeUsers > 0) {
      res.status(400).json({
        success: false,
        message: `No se puede desactivar el departamento. Tiene ${activeUsers} usuario(s) activo(s)`
      });
      return;
    }

    department.isActive = false;
    await department.save();

    logger.info(`Department deactivated: ${department.code} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Departamento desactivado exitosamente'
    });
  } catch (error: any) {
    logger.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar departamento',
      error: error.message
    });
  }
};
