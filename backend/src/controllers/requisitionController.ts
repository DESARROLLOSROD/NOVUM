import { Response } from 'express';
import { validationResult } from 'express-validator';
import Requisition from '../models/Requisition';
import ApprovalConfig from '../models/ApprovalConfig';
import Sequence from '../models/Sequence';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import { createNotification } from './notificationController';
import EmailService from '../services/EmailService';
import PdfService from '../services/PdfService';
import ExcelService from '../services/ExcelService';

export const createRequisition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.department) {
      throw new AppError('Usuario sin departamento asignado', 400);
    }

    const { title, description, requiredDate, priority, items } = req.body;

    // Calcular totales de items
    const processedItems = items.map((item: any, index: number) => ({
      ...item,
      itemNumber: index + 1,
      totalPrice: item.quantity * item.estimatedPrice,
    }));

    const totalAmount = processedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    // Obtener configuración de aprobación
    const approvalConfig = await ApprovalConfig.findOne({
      module: 'requisition',
      minAmount: { $lte: totalAmount },
      $or: [
        { maxAmount: { $gte: totalAmount } },
        { maxAmount: null },
      ],
      isActive: true,
    }).sort({ minAmount: -1 });

    if (!approvalConfig) {
      throw new AppError('No se encontró configuración de aprobación para este monto', 400);
    }

    // Generar número de requisición
    const requisitionNumber = await Sequence.getNextSequence('requisition');

    // Crear historial de aprobaciones
    const approvalHistory = approvalConfig.levels.map((level) => ({
      level: level.order,
      approver: null,
      status: 'pending' as const,
      comments: undefined,
      date: undefined,
    }));

    const requisition = await Requisition.create({
      requisitionNumber,
      requester: req.user.id,
      department: user.department,
      status: 'pending',
      priority,
      requestDate: new Date(),
      requiredDate,
      title,
      description,
      items: processedItems,
      totalAmount,
      approvalHistory,
      currentApprovalLevel: 0,
    });

    await requisition.populate('requester department items.category');

    logger.info(`Requisición creada: ${requisitionNumber} por ${user.email}`);

    res.status(201).json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    logger.error('Error creando requisición:', error);
    throw error;
  }
};

export const getRequisitions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { status, department, priority, search } = req.query;

    const filter: any = {};

    // Filtro por rol
    const user = await User.findById(req.user.id);
    if (user?.role === 'requester') {
      filter.requester = req.user.id;
    } else if (user?.role === 'approver') {
      // Ver requisiciones de su departamento o que requieran su aprobación
      filter.$or = [
        { department: user.department },
        { 'approvalHistory.approver': req.user.id },
      ];
    } else if (user?.department && user.role !== 'admin') {
      filter.department = user.department;
    }

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$text = { $search: search as string };
    }

    const requisitions = await Requisition.find(filter)
      .populate('requester', 'firstName lastName employeeCode')
      .populate('department', 'name code')
      .populate('items.category', 'name code')
      .sort({ requestDate: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Requisition.countDocuments(filter);

    res.json({
      success: true,
      data: requisitions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error obteniendo requisiciones:', error);
    throw error;
  }
};

export const getRequisitionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const requisition = await Requisition.findById(req.params.id)
      .populate('requester', 'firstName lastName employeeCode email')
      .populate('department', 'name code costCenter')
      .populate('items.category', 'name code')
      .populate('approvalHistory.approver', 'firstName lastName employeeCode')
      .populate('purchaseOrders');

    if (!requisition) {
      throw new AppError('Requisición no encontrada', 404);
    }

    res.json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    logger.error('Error obteniendo requisición:', error);
    throw error;
  }
};

export const approveRequisition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const { comments } = req.body;

    const requisition = await Requisition.findById(req.params.id);

    if (!requisition) {
      throw new AppError('Requisición no encontrada', 404);
    }

    if (requisition.status !== 'pending' && requisition.status !== 'in_approval') {
      throw new AppError('La requisición no está pendiente de aprobación', 400);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar que el usuario tiene permisos para aprobar este nivel
    const currentLevel = requisition.approvalHistory[requisition.currentApprovalLevel];
    const approvalConfig = await ApprovalConfig.findOne({
      module: 'requisition',
      minAmount: { $lte: requisition.totalAmount },
      $or: [
        { maxAmount: { $gte: requisition.totalAmount } },
        { maxAmount: null },
      ],
      isActive: true,
    }).sort({ minAmount: -1 });

    if (!approvalConfig) {
      throw new AppError('Configuración de aprobación no encontrada', 400);
    }

    const requiredLevel = approvalConfig.levels[requisition.currentApprovalLevel];
    if (user.role !== requiredLevel.role) {
      throw new AppError('No tiene permisos para aprobar en este nivel', 403);
    }

    // Aprobar nivel actual
    currentLevel.approver = user._id;
    currentLevel.status = 'approved';
    currentLevel.comments = comments;
    currentLevel.date = new Date();

    // Avanzar al siguiente nivel o aprobar completamente
    if (requisition.currentApprovalLevel < requisition.approvalHistory.length - 1) {
      requisition.currentApprovalLevel += 1;
      requisition.status = 'in_approval';
    } else {
      requisition.status = 'approved';
    }

    await requisition.save();

    // Enviar notificación y email al solicitante
    const requester = await User.findById(requisition.requester);
    if (requester) {
      await createNotification(
        requester._id,
        'requisition_approved',
        'Requisición Aprobada',
        `Tu requisición ${requisition.requisitionNumber} ha sido aprobada por ${user.firstName} ${user.lastName}.`,
        'Requisition',
        requisition._id
      );

      // Enviar email
      await EmailService.sendRequisitionApprovedEmail(
        requester.email,
        requisition.requisitionNumber,
        `${requester.firstName} ${requester.lastName}`,
        `${user.firstName} ${user.lastName}`,
        comments
      );
    }

    logger.info(`Requisición ${requisition.requisitionNumber} aprobada por ${user.email}`);

    res.json({
      success: true,
      message: 'Requisición aprobada exitosamente',
      data: requisition,
    });
  } catch (error) {
    logger.error('Error aprobando requisición:', error);
    throw error;
  }
};

export const rejectRequisition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const { reason } = req.body;

    if (!reason) {
      throw new AppError('El motivo del rechazo es requerido', 400);
    }

    const requisition = await Requisition.findById(req.params.id);

    if (!requisition) {
      throw new AppError('Requisición no encontrada', 404);
    }

    if (requisition.status !== 'pending' && requisition.status !== 'in_approval') {
      throw new AppError('La requisición no está pendiente de aprobación', 400);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const currentLevel = requisition.approvalHistory[requisition.currentApprovalLevel];
    currentLevel.approver = user._id;
    currentLevel.status = 'rejected';
    currentLevel.comments = reason;
    currentLevel.date = new Date();

    requisition.status = 'rejected';
    requisition.rejectionReason = reason;

    await requisition.save();

    // Enviar notificación y email al solicitante
    const requester = await User.findById(requisition.requester);
    if (requester) {
      await createNotification(
        requester._id,
        'requisition_rejected',
        'Requisición Rechazada',
        `Tu requisición ${requisition.requisitionNumber} ha sido rechazada por ${user.firstName} ${user.lastName}. Motivo: ${reason}`,
        'Requisition',
        requisition._id
      );

      // Enviar email
      await EmailService.sendRequisitionRejectedEmail(
        requester.email,
        requisition.requisitionNumber,
        `${requester.firstName} ${requester.lastName}`,
        `${user.firstName} ${user.lastName}`,
        reason
      );
    }

    logger.info(`Requisición ${requisition.requisitionNumber} rechazada por ${user.email}`);

    res.json({
      success: true,
      message: 'Requisición rechazada',
      data: requisition,
    });
  } catch (error) {
    logger.error('Error rechazando requisición:', error);
    throw error;
  }
};

export const cancelRequisition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const requisition = await Requisition.findById(req.params.id);

    if (!requisition) {
      throw new AppError('Requisición no encontrada', 404);
    }

    // Solo el creador o un admin pueden cancelar
    if (requisition.requester.toString() !== req.user.id) {
      const user = await User.findById(req.user.id);
      if (user?.role !== 'admin') {
        throw new AppError('No tiene permisos para cancelar esta requisición', 403);
      }
    }

    if (requisition.status === 'ordered' || requisition.status === 'partially_ordered') {
      throw new AppError('No se puede cancelar una requisición con órdenes de compra', 400);
    }

    requisition.status = 'cancelled';
    await requisition.save();

    logger.info(`Requisición ${requisition.requisitionNumber} cancelada`);

    res.json({
      success: true,
      message: 'Requisición cancelada exitosamente',
      data: requisition,
    });
  } catch (error) {
    logger.error('Error cancelando requisición:', error);
    throw error;
  }
};

// GET /api/requisitions/:id/export/pdf - Exportar requisición a PDF
export const exportRequisitionToPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const requisition = await Requisition.findById(req.params.id)
      .populate('requester', 'firstName lastName email employeeCode')
      .populate('department', 'name code costCenter')
      .populate('items.category', 'name code')
      .populate('approvalHistory.approver', 'firstName lastName employeeCode');

    if (!requisition) {
      throw new AppError('Requisición no encontrada', 404);
    }

    const pdfBuffer = await PdfService.generateRequisitionPdf(requisition);

    logger.info(`PDF exportado para requisición ${requisition.requisitionNumber}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=requisicion-${requisition.requisitionNumber}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exportando requisición a PDF:', error);
    throw error;
  }
};

// GET /api/requisitions/:id/export/excel - Exportar requisición a Excel
export const exportRequisitionToExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const requisition = await Requisition.findById(req.params.id)
      .populate('requester', 'firstName lastName email employeeCode')
      .populate('department', 'name code costCenter')
      .populate('items.category', 'name code')
      .populate('approvalHistory.approver', 'firstName lastName employeeCode');

    if (!requisition) {
      throw new AppError('Requisición no encontrada', 404);
    }

    const excelBuffer = await ExcelService.generateSingleRequisitionExcel(requisition);

    logger.info(`Excel exportado para requisición ${requisition.requisitionNumber}`);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=requisicion-${requisition.requisitionNumber}.xlsx`
    );
    res.send(excelBuffer);
  } catch (error) {
    logger.error('Error exportando requisición a Excel:', error);
    throw error;
  }
};

// GET /api/requisitions/export/excel - Exportar múltiples requisiciones a Excel
export const exportRequisitionsToExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Filtros
    const filter: any = {};
    if (!['admin', 'finance', 'purchasing'].includes(user.role)) {
      filter.department = user.department;
    }

    const { status, department, dateFrom, dateTo } = req.query;

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (dateFrom || dateTo) {
      filter.requestDate = {};
      if (dateFrom) filter.requestDate.$gte = new Date(dateFrom as string);
      if (dateTo) filter.requestDate.$lte = new Date(dateTo as string);
    }

    const requisitions = await Requisition.find(filter)
      .populate('requester', 'firstName lastName email')
      .populate('department', 'name code costCenter')
      .populate('items.category', 'name code')
      .sort({ requestDate: -1 })
      .limit(1000); // Limitar a 1000 para evitar problemas de memoria

    const excelBuffer = await ExcelService.generateRequisitionsExcel(requisitions);

    logger.info(`Excel exportado con ${requisitions.length} requisiciones`);

    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=requisiciones-${timestamp}.xlsx`
    );
    res.send(excelBuffer);
  } catch (error) {
    logger.error('Error exportando requisiciones a Excel:', error);
    throw error;
  }
};
