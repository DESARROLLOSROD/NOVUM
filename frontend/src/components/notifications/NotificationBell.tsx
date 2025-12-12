import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, Notification } from '@/services/notificationService';
import { Bell, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => notificationService.getNotifications({ limit: 5, unreadOnly: false }),
    enabled: isOpen,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

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

  const count = unreadCount?.data?.count || 0;

  return (
    <div className="relative notification-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {count > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            {count > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                disabled={markAllAsReadMutation.isPending}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications?.data.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications?.data.map((notification) => (
                  <Link
                    key={notification.id}
                    to="/notifications"
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, notification.id)}
                              className="p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                              title="Marcar como leída"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium block text-center"
            >
              Ver todas las notificaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
