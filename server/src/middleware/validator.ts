import { body, param, query, ValidationChain } from 'express-validator';

export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
];

export const createUserValidation: ValidationChain[] = [
  body('employeeCode')
    .notEmpty()
    .withMessage('El código de empleado es requerido')
    .isLength({ min: 3, max: 20 })
    .withMessage('El código debe tener entre 3 y 20 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'),
  body('firstName')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .trim(),
  body('lastName')
    .notEmpty()
    .withMessage('El apellido es requerido')
    .trim(),
  body('role')
    .isIn(['admin', 'approver', 'purchasing', 'finance', 'warehouse', 'requester'])
    .withMessage('Rol inválido'),
];

export const createRequisitionValidation: ValidationChain[] = [
  body('title')
    .notEmpty()
    .withMessage('El título es requerido')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El título debe tener entre 5 y 200 caracteres'),
  body('requiredDate')
    .isISO8601()
    .withMessage('Fecha requerida inválida')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('La fecha requerida debe ser futura');
      }
      return true;
    }),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Prioridad inválida'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un artículo'),
  body('items.*.description')
    .notEmpty()
    .withMessage('La descripción del artículo es requerida'),
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('La cantidad debe ser mayor a 0'),
  body('items.*.estimatedPrice')
    .isFloat({ min: 0 })
    .withMessage('El precio estimado debe ser mayor o igual a 0'),
];

export const idValidation: ValidationChain[] = [
  param('id')
    .isMongoId()
    .withMessage('ID inválido'),
];

export const paginationValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
];

export const createPurchaseOrderValidation: ValidationChain[] = [
  body('supplier')
    .isMongoId()
    .withMessage('ID de proveedor inválido'),
  body('expectedDeliveryDate')
    .isISO8601()
    .withMessage('Fecha de entrega inválida')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('La fecha de entrega debe ser futura');
      }
      return true;
    }),
  body('deliveryAddress')
    .notEmpty()
    .withMessage('La dirección de entrega es requerida')
    .trim(),
  body('paymentTerms')
    .notEmpty()
    .withMessage('Los términos de pago son requeridos')
    .trim(),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un artículo'),
  body('items.*.description')
    .notEmpty()
    .withMessage('La descripción del artículo es requerida'),
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('La cantidad debe ser mayor a 0'),
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser mayor o igual a 0'),
];

export const updatePurchaseOrderValidation: ValidationChain[] = [
  body('supplier')
    .optional()
    .isMongoId()
    .withMessage('ID de proveedor inválido'),
  body('expectedDeliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de entrega inválida'),
  body('deliveryAddress')
    .optional()
    .trim(),
  body('paymentTerms')
    .optional()
    .trim(),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un artículo'),
];

