import express, { Application } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import connectDB from './config/database';
import logger from './config/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';


// Cargar variables de entorno
dotenv.config();

// Crear app de Express
const app: Application = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting global
app.use('/api/', apiLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NOVUM API is running',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de la API
import authRoutes from './routes/authRoutes';
import requisitionRoutes from './routes/requisitionRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/requisitions', requisitionRoutes);

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

