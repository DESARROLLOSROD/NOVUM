import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from '../config/logger';

dotenv.config();

import User from '../models/User';
import Department from '../models/Department';
import Category from '../models/Category';
import Sequence from '../models/Sequence';
import ApprovalConfig from '../models/ApprovalConfig';
import Supplier from '../models/Supplier';
import Requisition from '../models/Requisition';
import PurchaseOrder from '../models/PurchaseOrder';
import GoodsReceipt from '../models/GoodsReceipt';

const resetDatabase = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI no está definida');
    }

    await mongoose.connect(mongoURI);
    logger.info('Conectado a MongoDB');

    logger.info('Limpiando todas las colecciones...');

    await User.deleteMany({});
    await Department.deleteMany({});
    await Category.deleteMany({});
    await Sequence.deleteMany({});
    await ApprovalConfig.deleteMany({});
    await Supplier.deleteMany({});
    await Requisition.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await GoodsReceipt.deleteMany({});

    logger.info('✓ Base de datos limpiada exitosamente');
    logger.info('Ejecuta "npm run seed" para cargar datos de prueba');

    process.exit(0);
  } catch (error) {
    logger.error('Error al limpiar la base de datos:', error);
    process.exit(1);
  }
};

resetDatabase();
