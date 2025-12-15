import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Department from '../models/Department';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, department, isActive, search } = req.query;

    // Build filter
    const filter: any = {};

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .populate('department', 'name code')
      .select('-password')
      .sort({ createdAt: -1 });

    logger.info(`Users list retrieved. Count: ${users.length}`);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error getting users:', error);
    next(error);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department')
      .select('-password');

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error getting user:', error);
    next(error);
  }
};

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Private (Admin only)
 */
export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      employeeCode,
      role,
      department,
      approvalLimit
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Check employee code
    const existingCode = await User.findOne({ employeeCode });
    if (existingCode) {
      throw new AppError('El código de empleado ya existe', 400);
    }

    // Verify department exists
    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        throw new AppError('El departamento no existe', 400);
      }
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      employeeCode,
      role,
      department,
      approvalLimit: approvalLimit || 0,
      isActive: true
    });

    // Return user without password
    const userWithoutPassword = await User.findById(user._id)
      .populate('department', 'name code')
      .select('-password');

    logger.info(`User created: ${email} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: userWithoutPassword
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 */
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      employeeCode,
      role,
      department,
      approvalLimit,
      isActive
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Check if employee code is being changed and if it's unique
    if (employeeCode && employeeCode !== user.employeeCode) {
      const existingCode = await User.findOne({ employeeCode });
      if (existingCode) {
        throw new AppError('El código de empleado ya existe', 400);
      }
    }

    // Verify department exists if changing
    if (department && department !== user.department?.toString()) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        throw new AppError('El departamento no existe', 400);
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (employeeCode) user.employeeCode = employeeCode;
    if (role) user.role = role;
    if (department) user.department = department;
    if (approvalLimit !== undefined) user.approvalLimit = approvalLimit;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const updatedUser = await User.findById(id)
      .populate('department', 'name code')
      .select('-password');

    logger.info(`User updated: ${user.email} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    next(error);
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user?.id) {
      throw new AppError('No puedes desactivar tu propia cuenta', 400);
    }

    // Soft delete - just deactivate
    user.isActive = false;
    await user.save();

    logger.info(`User deactivated: ${user.email} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    next(error);
  }
};

/**
 * @desc    Reset user password (Admin)
 * @route   PUT /api/users/:id/reset-password
 * @access  Private (Admin only)
 */
export const resetUserPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password reset for user: ${user.email} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    logger.error('Error resetting password:', error);
    next(error);
  }
};
