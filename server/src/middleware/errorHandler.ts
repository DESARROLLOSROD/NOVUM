import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
  stack?: string;
}

class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError };

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Error de Mongoose - CastError (ID inválido)
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = new AppError(message, 404);
  }

  // Error de Mongoose - Duplicado
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `El ${field} ya existe`;
    error = new AppError(message, 400);
  }

  // Error de Mongoose - Validación
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e: any) => e.message)
      .join(', ');
    error = new AppError(message, 400);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new AppError(message, 401);
  }

  // Error de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new AppError(message, 401);
  }

  const response: ErrorResponse = {
    success: false,
    message: error.message || 'Error del servidor',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.errors = err.errors;
  }

  res.status(error.statusCode || 500).json(response);
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Ruta no encontrada - ${req.originalUrl}`, 404);
  next(error);
};
