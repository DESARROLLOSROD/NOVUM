import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

export type NotificationType =
  | 'requisition_created'
  | 'requisition_approved'
  | 'requisition_rejected'
  | 'requisition_cancelled'
  | 'budget_alert'
  | 'approval_required'
  | 'purchase_order_created';

export interface Notification {
  id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedModel?: 'Requisition' | 'PurchaseOrder' | 'Department';
  relatedId?: string;
  isRead: boolean;
  readAt?: string;
  sentByEmail: boolean;
  emailSentAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const notificationService = {
  getNotifications: async (
    params?: GetNotificationsParams
  ): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<PaginatedResponse<Notification>>('/notifications', {
      params: {
        ...params,
        unreadOnly: params?.unreadOnly ? 'true' : 'false',
      },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    const response = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.patch<ApiResponse<{ count: number }>>('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/notifications/${id}`);
    return response.data;
  },
};
