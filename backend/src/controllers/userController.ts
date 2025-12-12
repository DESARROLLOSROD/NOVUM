import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Department from '../models/Department';
import logger from '../config/logger';

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    logger.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department')
      .select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    logger.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Private (Admin only)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
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
      res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
      return;
    }

    // Check employee code
    const existingCode = await User.findOne({ employeeCode });
    if (existingCode) {
      res.status(400).json({
        success: false,
        message: 'El código de empleado ya existe'
      });
      return;
    }

    // Verify department exists
    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        res.status(400).json({
          success: false,
          message: 'El departamento no existe'
        });
        return;
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
  } catch (error: any) {
    logger.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
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
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Check if employee code is being changed and if it's unique
    if (employeeCode && employeeCode !== user.employeeCode) {
      const existingCode = await User.findOne({ employeeCode });
      if (existingCode) {
        res.status(400).json({
          success: false,
          message: 'El código de empleado ya existe'
        });
        return;
      }
    }

    // Verify department exists if changing
    if (department && department !== user.department?.toString()) {
      const deptExists = await Department.findById(department);
      if (!deptExists) {
        res.status(400).json({
          success: false,
          message: 'El departamento no existe'
        });
        return;
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
  } catch (error: any) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user?.id) {
      res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
      return;
    }

    // Soft delete - just deactivate
    user.isActive = false;
    await user.save();

    logger.info(`User deactivated: ${user.email} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error: any) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Reset user password (Admin)
 * @route   PUT /api/users/:id/reset-password
 * @access  Private (Admin only)
 */
export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password reset for user: ${user.email} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error: any) {
    logger.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer contraseña',
      error: error.message
    });
  }
};
