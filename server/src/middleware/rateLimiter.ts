import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión, por favor intente de nuevo más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos por defecto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests por defecto
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 creaciones por minuto
  message: {
    success: false,
    message: 'Demasiadas solicitudes de creación, por favor espere un momento',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
