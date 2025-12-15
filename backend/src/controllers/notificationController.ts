import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification, { NotificationType } from '../models/Notification';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import mongoose from 'mongoose';

// GET /api/notifications - Obtener notificaciones del usuario
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;

    const filter: any = { user: req.user.id };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Notification.countDocuments(filter);

    logger.info(`Notifications retrieved for user ${req.user.id}`);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error obteniendo notificaciones:', error);
    throw error;
  }
};

// GET /api/notifications/unread-count - Contar notificaciones no leídas
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const count = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    logger.error('Error obteniendo contador de no leídas:', error);
    throw error;
  }
};

// PATCH /api/notifications/:id/read - Marcar notificación como leída
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!notification) {
      throw new AppError('Notificación no encontrada', 404);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    logger.info(`Notification ${id} marked as read by user ${req.user.id}`);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error marcando notificación como leída:', error);
    throw error;
  }
};

// PATCH /api/notifications/mark-all-read - Marcar todas como leídas
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const result = await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    logger.info(`All notifications marked as read for user ${req.user.id}`);

    res.json({
      success: true,
      message: `${result.modifiedCount} notificaciones marcadas como leídas`,
      data: { count: result.modifiedCount },
    });
  } catch (error) {
    logger.error('Error marcando todas las notificaciones como leídas:', error);
    throw error;
  }
};

// DELETE /api/notifications/:id - Eliminar notificación
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!notification) {
      throw new AppError('Notificación no encontrada', 404);
    }

    logger.info(`Notification ${id} deleted by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando notificación:', error);
    throw error;
  }
};

// Función helper para crear notificaciones (exportada para uso en otros controladores)
export const createNotification = async (
  userId: mongoose.Types.ObjectId | string,
  type: NotificationType,
  title: string,
  message: string,
  relatedModel?: 'Requisition' | 'PurchaseOrder' | 'Department',
  relatedId?: mongoose.Types.ObjectId | string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedModel,
      relatedId,
      metadata,
      isRead: false,
      sentByEmail: false,
    });

    logger.info(`Notification created for user ${userId}: ${type}`);
  } catch (error) {
    logger.error('Error creating notification:', error);
    // No lanzamos error para no interrumpir el flujo principal
  }
};
