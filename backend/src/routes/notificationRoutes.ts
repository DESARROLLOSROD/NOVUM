import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

// GET /api/notifications - Obtener notificaciones
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Contar no leídas
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/mark-all-read - Marcar todas como leídas
router.patch('/mark-all-read', markAllAsRead);

// PATCH /api/notifications/:id/read - Marcar como leída
router.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id - Eliminar notificación
router.delete('/:id', deleteNotification);

export default router;
