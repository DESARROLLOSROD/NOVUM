import mongoose from 'mongoose';
import logger from './logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    const options = {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority' as const,
    };

    await mongoose.connect(mongoURI, options);

    logger.info('✓ Conexión exitosa a MongoDB Atlas');

    mongoose.connection.on('error', (err) => {
      logger.error('Error de conexión a MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Desconectado de MongoDB');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Conexión a MongoDB cerrada por terminación de la aplicación');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
