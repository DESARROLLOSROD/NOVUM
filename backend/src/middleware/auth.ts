import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import logger from '../config/logger';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    employeeCode: string;
  };
}

export const protect = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('No autorizado - Token no proporcionado', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está configurado');
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new AppError('Usuario no encontrado', 401);
    }

    if (!user.isActive) {
      throw new AppError('Usuario inactivo', 401);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeCode: user.employeeCode,
    };

    next();
  } catch (error) {
    logger.error('Error en autenticación:', error);
    next(new AppError('No autorizado - Token inválido', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(`El rol ${req.user.role} no tiene permisos para acceder a este recurso`, 403);
    }

    next();
  };
};

export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET no está configurado');
  }

  const jwtExpire = process.env.JWT_EXPIRE || '7d';

  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: jwtExpire,
  } as jwt.SignOptions);
};
