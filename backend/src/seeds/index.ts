import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from '../config/logger';

// Cargar variables de entorno
dotenv.config();

// Importar modelos
import User from '../models/User';
import Department from '../models/Department';
import Category from '../models/Category';
import Sequence from '../models/Sequence';
import ApprovalConfig from '../models/ApprovalConfig';
import Supplier from '../models/Supplier';

const seedData = async (): Promise<void> => {
  try {
    // Conectar a MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI no está definida');
    }

    await mongoose.connect(mongoURI);
    logger.info('Conectado a MongoDB');

    // Limpiar colecciones existentes
    logger.info('Limpiando colecciones...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Category.deleteMany({});
    await Sequence.deleteMany({});
    await ApprovalConfig.deleteMany({});
    await Supplier.deleteMany({});

    // 1. Crear Departamentos
    logger.info('Creando departamentos...');
    const departments = await Department.insertMany([
      { code: 'DIR', name: 'Dirección General', costCenter: 'CC-001' },
      { code: 'TEC', name: 'Tecnología', costCenter: 'CC-002' },
      { code: 'FIN', name: 'Finanzas', costCenter: 'CC-003' },
      { code: 'RH', name: 'Recursos Humanos', costCenter: 'CC-004' },
      { code: 'OPS', name: 'Operaciones', costCenter: 'CC-005' },
      { code: 'MKT', name: 'Marketing', costCenter: 'CC-006' },
      { code: 'ALM', name: 'Almacén', costCenter: 'CC-007' },
      { code: 'COM', name: 'Compras', costCenter: 'CC-008' },
    ]);
    logger.info(`✓ ${departments.length} departamentos creados`);

    // 2. Crear Usuarios
    logger.info('Creando usuarios...');
    const usersData = [
      {
        employeeCode: 'EMP001',
        email: 'admin@novum.com',
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'admin',
        password: 'Admin123!',
        department: departments[0]._id,
        isActive: true,
      },
      {
        employeeCode: 'EMP002',
        email: 'compras@novum.com',
        firstName: 'Juan',
        lastName: 'Compras',
        role: 'purchasing',
        password: 'Compras123!',
        department: departments[7]._id,
        isActive: true,
      },
      {
        employeeCode: 'EMP003',
        email: 'finanzas@novum.com',
        firstName: 'María',
        lastName: 'Finanzas',
        role: 'finance',
        password: 'Finanzas123!',
        department: departments[2]._id,
        isActive: true,
      },
      {
        employeeCode: 'EMP004',
        email: 'aprobador@novum.com',
        firstName: 'Carlos',
        lastName: 'Aprobador',
        role: 'approver',
        password: 'Aprobador123!',
        approvalLimit: 50000,
        department: departments[1]._id,
        isActive: true,
      },
      {
        employeeCode: 'EMP005',
        email: 'almacen@novum.com',
        firstName: 'Pedro',
        lastName: 'Almacén',
        role: 'warehouse',
        password: 'Almacen123!',
        department: departments[6]._id,
        isActive: true,
      },
      {
        employeeCode: 'EMP006',
        email: 'solicitante@novum.com',
        firstName: 'Ana',
        lastName: 'Solicitante',
        role: 'requester',
        password: 'Solicitante123!',
        department: departments[1]._id,
        isActive: true,
      },
      {
        employeeCode: 'EMP007',
        email: 'solicitante2@novum.com',
        firstName: 'Luis',
        lastName: 'García',
        role: 'requester',
        password: 'Solicitante123!',
        department: departments[4]._id,
        isActive: true,
      },
      {
        employeeCode: 'EMP008',
        email: 'aprobador2@novum.com',
        firstName: 'Laura',
        lastName: 'Martínez',
        role: 'approver',
        password: 'Aprobador123!',
        approvalLimit: 100000,
        department: departments[0]._id,
        isActive: true,
      },
    ];

    // Crear usuarios uno por uno para que se ejecute el hook pre-save
    const users = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      users.push(user);
    }
    logger.info(`✓ ${users.length} usuarios creados`);

    // 3. Crear Categorías
    logger.info('Creando categorías...');

    // Categorías padre
    logger.info('Creando categorías padre...');
    const techCat = await Category.create({
      code: 'TEC',
      name: 'Tecnología',
      parent: null,
    });
    logger.info(`✓ Categoría creada: ${techCat.code} - path: ${techCat.path}`);

    const officeCat = await Category.create({
      code: 'OFI',
      name: 'Oficina',
      parent: null,
    });
    logger.info(`✓ Categoría creada: ${officeCat.code} - path: ${officeCat.path}`);

    const serviceCat = await Category.create({
      code: 'SER',
      name: 'Servicios',
      parent: null,
    });
    logger.info(`✓ Categoría creada: ${serviceCat.code} - path: ${serviceCat.path}`);

    const maintenanceCat = await Category.create({
      code: 'MAN',
      name: 'Mantenimiento',
      parent: null,
    });
    logger.info(`✓ Categoría creada: ${maintenanceCat.code} - path: ${maintenanceCat.path}`);

    // Subcategorías de Tecnología
    logger.info('Creando subcategorías de Tecnología...');
    await Category.create({ code: 'TEC-HW', name: 'Hardware', parent: techCat._id });
    await Category.create({ code: 'TEC-SW', name: 'Software', parent: techCat._id });
    await Category.create({ code: 'TEC-RED', name: 'Redes', parent: techCat._id });
    logger.info('✓ Subcategorías de Tecnología creadas');

    // Subcategorías de Oficina
    logger.info('Creando subcategorías de Oficina...');
    await Category.create({ code: 'OFI-PAP', name: 'Papelería', parent: officeCat._id });
    await Category.create({ code: 'OFI-MOB', name: 'Mobiliario', parent: officeCat._id });
    await Category.create({ code: 'OFI-LIM', name: 'Limpieza', parent: officeCat._id });
    logger.info('✓ Subcategorías de Oficina creadas');

    // Subcategorías de Servicios
    logger.info('Creando subcategorías de Servicios...');
    await Category.create({ code: 'SER-PRO', name: 'Profesionales', parent: serviceCat._id });
    await Category.create({ code: 'SER-MAN', name: 'Servicios de Mantenimiento', parent: serviceCat._id });
    logger.info('✓ Subcategorías de Servicios creadas');

    // Subcategorías de Mantenimiento
    logger.info('Creando subcategorías de Mantenimiento...');
    await Category.create({ code: 'MAN-ELE', name: 'Eléctrico', parent: maintenanceCat._id });
    await Category.create({ code: 'MAN-PLO', name: 'Plomería', parent: maintenanceCat._id });
    logger.info('✓ Subcategorías de Mantenimiento creadas');

    logger.info('✓ Categorías creadas');

    // 4. Crear Secuencias
    logger.info('Creando secuencias...');
    const currentYear = new Date().getFullYear();
    await Sequence.insertMany([
      { name: 'requisition', prefix: 'REQ', currentValue: 0, year: currentYear, padding: 5 },
      { name: 'purchase_order', prefix: 'OC', currentValue: 0, year: currentYear, padding: 5 },
      { name: 'goods_receipt', prefix: 'REC', currentValue: 0, year: currentYear, padding: 5 },
    ]);
    logger.info('✓ Secuencias creadas');

    // 5. Crear Configuraciones de Aprobación
    logger.info('Creando configuraciones de aprobación...');
    await ApprovalConfig.insertMany([
      {
        name: 'Requisiciones hasta $10,000',
        module: 'requisition',
        minAmount: 0,
        maxAmount: 10000,
        levels: [
          { order: 1, name: 'Jefe de Departamento', role: 'approver' },
        ],
        isActive: true,
      },
      {
        name: 'Requisiciones $10,001 - $50,000',
        module: 'requisition',
        minAmount: 10001,
        maxAmount: 50000,
        levels: [
          { order: 1, name: 'Jefe de Departamento', role: 'approver' },
          { order: 2, name: 'Gerente de Finanzas', role: 'finance' },
        ],
        isActive: true,
      },
      {
        name: 'Requisiciones mayores a $50,000',
        module: 'requisition',
        minAmount: 50001,
        maxAmount: undefined,
        levels: [
          { order: 1, name: 'Jefe de Departamento', role: 'approver' },
          { order: 2, name: 'Gerente de Finanzas', role: 'finance' },
          { order: 3, name: 'Director General', role: 'admin' },
        ],
        isActive: true,
      },
      {
        name: 'Órdenes de Compra hasta $25,000',
        module: 'purchase_order',
        minAmount: 0,
        maxAmount: 25000,
        levels: [
          { order: 1, name: 'Gerente de Compras', role: 'purchasing' },
        ],
        isActive: true,
      },
      {
        name: 'Órdenes de Compra mayores a $25,000',
        module: 'purchase_order',
        minAmount: 25001,
        maxAmount: undefined,
        levels: [
          { order: 1, name: 'Gerente de Compras', role: 'purchasing' },
          { order: 2, name: 'Director Financiero', role: 'finance' },
        ],
        isActive: true,
      },
    ]);
    logger.info('✓ Configuraciones de aprobación creadas');

    // 6. Crear Proveedores
    logger.info('Creando proveedores...');
    const techCategory = await Category.findOne({ code: 'TEC-HW' });
    const officeCategory = await Category.findOne({ code: 'OFI-PAP' });

    await Supplier.insertMany([
      {
        supplierCode: 'PROV001',
        businessName: 'Tecnología y Computadoras S.A. de C.V.',
        tradeName: 'TecnoComp',
        taxId: 'TCC850101ABC',
        email: 'ventas@tecnocomp.com',
        phone: '5555-1234',
        website: 'www.tecnocomp.com',
        address: {
          street: 'Av. Insurgentes 1234',
          city: 'Ciudad de México',
          state: 'CDMX',
          postalCode: '03100',
          country: 'México',
        },
        contactPerson: {
          name: 'Roberto Sánchez',
          position: 'Gerente de Ventas',
          email: 'roberto@tecnocomp.com',
          phone: '5555-1234',
        },
        paymentTerms: '30 días',
        categories: [techCategory!._id],
        rating: 4.5,
        isActive: true,
      },
      {
        supplierCode: 'PROV002',
        businessName: 'Papelería Corporativa del Centro S.A.',
        tradeName: 'PapelCorp',
        taxId: 'PCC920202DEF',
        email: 'contacto@papelcorp.com',
        phone: '5555-5678',
        website: 'www.papelcorp.com',
        address: {
          street: 'Calle Reforma 567',
          city: 'Ciudad de México',
          state: 'CDMX',
          postalCode: '06600',
          country: 'México',
        },
        contactPerson: {
          name: 'Patricia López',
          position: 'Ejecutiva de Cuentas',
          email: 'patricia@papelcorp.com',
          phone: '5555-5678',
        },
        paymentTerms: 'Contado',
        categories: [officeCategory!._id],
        rating: 4.0,
        isActive: true,
      },
      {
        supplierCode: 'PROV003',
        businessName: 'Soluciones Integrales de Software S.C.',
        tradeName: 'SoftIntegral',
        taxId: 'SIS880303GHI',
        email: 'ventas@softintegral.com',
        phone: '5555-9012',
        website: 'www.softintegral.com',
        address: {
          street: 'Av. Universidad 890',
          city: 'Ciudad de México',
          state: 'CDMX',
          postalCode: '04510',
          country: 'México',
        },
        contactPerson: {
          name: 'Marcos Hernández',
          position: 'Director Comercial',
          email: 'marcos@softintegral.com',
          phone: '5555-9012',
        },
        paymentTerms: '60 días',
        categories: [techCategory!._id],
        rating: 4.8,
        isActive: true,
      },
    ]);
    logger.info('✓ Proveedores creados');

    logger.info('');
    logger.info('========================================');
    logger.info('✓ Seed completado exitosamente');
    logger.info('========================================');
    logger.info('');
    logger.info('Credenciales de acceso:');
    logger.info('');
    logger.info('Admin:');
    logger.info('  Email: admin@novum.com');
    logger.info('  Password: Admin123!');
    logger.info('');
    logger.info('Compras:');
    logger.info('  Email: compras@novum.com');
    logger.info('  Password: Compras123!');
    logger.info('');
    logger.info('Finanzas:');
    logger.info('  Email: finanzas@novum.com');
    logger.info('  Password: Finanzas123!');
    logger.info('');
    logger.info('Aprobador:');
    logger.info('  Email: aprobador@novum.com');
    logger.info('  Password: Aprobador123!');
    logger.info('');
    logger.info('Almacén:');
    logger.info('  Email: almacen@novum.com');
    logger.info('  Password: Almacen123!');
    logger.info('');
    logger.info('Solicitante:');
    logger.info('  Email: solicitante@novum.com');
    logger.info('  Password: Solicitante123!');
    logger.info('');
    logger.info('========================================');

    process.exit(0);
  } catch (error) {
    logger.error('Error en el seed:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
};

seedData();
