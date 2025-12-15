import express, { Application } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/database';
import logger from './config/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { validateEnv } from './config/env';


// Cargar variables de entorno y validar
dotenv.config();
validateEnv();

// Crear app de Express
const app: Application = express();

// Middlewares de seguridad
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting global
app.use('/api/', apiLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize user input to prevent MongoDB Operator Injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`MongoDB injection attempt detected: key "${key}" from IP ${req.ip}`);
  },
}));

// Compresión
app.use(compression());

// Logging HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'NOVUM API is running',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
import authRoutes from './routes/authRoutes';
import requisitionRoutes from './routes/requisitionRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import budgetRoutes from './routes/budgetRoutes';
import notificationRoutes from './routes/notificationRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import supplierRoutes from './routes/supplierRoutes';
import departmentRoutes from './routes/departmentRoutes';
import categoryRoutes from './routes/categoryRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/requisitions', requisitionRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);

// Manejo de rutas no encontradas
app.use(notFound);

// Manejo de errores
app.use(errorHandler);

// Puerto
const PORT = process.env.PORT || 5000;

// Función de inicialización
const startServer = async () => {
  try {
    // Conectar a MongoDB primero
    await connectDB();

    // Iniciar servidor HTTP después de conectar a la base de datos
    const server = app.listen(PORT, () => {
      logger.info(`========================================`);
      logger.info(`🚀 Servidor NOVUM corriendo en puerto ${PORT}`);
      logger.info(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   URL: http://localhost:${PORT}`);
      logger.info(`========================================`);
    });

    // Manejo de errores no capturados
    process.on('unhandledRejection', (err: Error) => {
      logger.error('Unhandled Rejection:', err);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception:', err);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

export default app;

