import { Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import '../models/Department'; // Importar para registrar el modelo
import { AuthRequest, generateToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Errores de validación', 400, errors.array());
    }

    const { employeeCode, email, password, firstName, lastName, role, department, approvalLimit } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { employeeCode }],
    });

    if (existingUser) {
      throw new AppError('El usuario ya existe', 400);
    }

    const user = await User.create({
      employeeCode,
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      approvalLimit,
    });

    const token = generateToken(user._id.toString());

    logger.info(`Nuevo usuario registrado: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          employeeCode: user.employeeCode,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Error en registro:', error);
    throw error;
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Errores de validación', 400, errors.array());
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password').populate('department');

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    if (!user.isActive) {
      throw new AppError('Usuario inactivo', 401);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id.toString());

    logger.info(`Usuario autenticado: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          employeeCode: user.employeeCode,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          approvalLimit: user.approvalLimit,
        },
        token,
      },
    });
  } catch (error) {
    logger.error('Error en login:', error);
    throw error;
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const user = await User.findById(req.user.id).populate('department');

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        employeeCode: user.employeeCode,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        approvalLimit: user.approvalLimit,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo usuario:', error);
    throw error;
  }
};

export const updatePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Contraseña actualizada: ${user.email}`);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    logger.error('Error actualizando contraseña:', error);
    throw error;
  }
};
