import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import logger from '../config/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    employeeCode: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está configurado');
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Usuario inactivo',
      });
      return;
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
    res.status(401).json({
      success: false,
      message: 'No autorizado - Token inválido',
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autorizado',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `El rol ${req.user.role} no tiene permisos para acceder a este recurso`,
      });
      return;
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
  });
};
