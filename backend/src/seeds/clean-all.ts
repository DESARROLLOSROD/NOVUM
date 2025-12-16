import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from '../config/logger';

// Cargar variables de entorno
dotenv.config();

const cleanAllCollections = async (): Promise<void> => {
  try {
    // Conectar a MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI no está definida');
    }

    await mongoose.connect(mongoURI);
    logger.info('Conectado a MongoDB');

    // Obtener todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();

    logger.info(`Encontradas ${collections.length} colecciones`);

    // Eliminar cada colección
    for (const collection of collections) {
      logger.info(`Eliminando colección: ${collection.name}`);
      await mongoose.connection.db.dropCollection(collection.name);
    }

    logger.info('✓ Todas las colecciones eliminadas exitosamente');
    logger.info('Ejecuta "npm run seed" para cargar datos de prueba');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error al limpiar las colecciones:', error);
    process.exit(1);
  }
};

cleanAllCollections();
