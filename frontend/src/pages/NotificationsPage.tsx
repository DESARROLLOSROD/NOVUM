import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, Notification } from '@/services/notificationService';
import { Check, Trash2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', page, unreadOnly],
    queryFn: () => notificationService.getNotifications({ page, limit, unreadOnly }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Notificación marcada como leída');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Notificación eliminada');
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      deleteNotificationMutation.mutate(id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'requisition_approved':
        return '✅';
      case 'requisition_rejected':
        return '❌';
      case 'budget_alert':
        return '⚠️';
      case 'approval_required':
        return '📋';
      default:
        return '📄';
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.relatedModel === 'Requisition' && notification.relatedId) {
      return `/requisitions/${notification.relatedId}`;
    }
    if (notification.relatedModel === 'Department' && notification.relatedId) {
      return `/budgets`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones</h1>
        <p className="mt-2 text-gray-600">
          Todas tus notificaciones en un solo lugar
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="card mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Solo no leídas
              </span>
            </label>
          </div>

          {notifications && notifications.data.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn btn-sm btn-primary"
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="w-4 h-4 mr-1" />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-4">
        {notifications?.data.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              {unreadOnly ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </p>
          </div>
        ) : (
          notifications?.data.map((notification) => {
            const link = getNotificationLink(notification);
            const NotificationContent = (
              <div
                className={`card hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleMarkAsRead(notification.id);
                            }}
                            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                            title="Marcar como leída"
                          >
                            <Check className="w-5 h-5 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(notification.id);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );

            return link ? (
              <Link key={notification.id} to={link}>
                {NotificationContent}
              </Link>
            ) : (
              <div key={notification.id}>{NotificationContent}</div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {notifications && notifications.pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="btn btn-sm"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {notifications.pagination.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === notifications.pagination.pages}
            className="btn btn-sm"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
