import api from './api';
import {
  Requisition,
  CreateRequisitionData,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface GetRequisitionsParams {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  priority?: string;
  search?: string;
}

export const requisitionService = {
  create: async (data: CreateRequisitionData): Promise<ApiResponse<Requisition>> => {
    const response = await api.post<ApiResponse<Requisition>>('/requisitions', data);
    return response.data;
  },

  getAll: async (params?: GetRequisitionsParams): Promise<PaginatedResponse<Requisition>> => {
    const response = await api.get<PaginatedResponse<Requisition>>('/requisitions', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Requisition>> => {
    const response = await api.get<ApiResponse<Requisition>>(`/requisitions/${id}`);
    return response.data;
  },

  approve: async (id: string, comments?: string): Promise<ApiResponse<Requisition>> => {
    const response = await api.post<ApiResponse<Requisition>>(`/requisitions/${id}/approve`, {
      comments,
    });
    return response.data;
  },

  reject: async (id: string, reason: string): Promise<ApiResponse<Requisition>> => {
    const response = await api.post<ApiResponse<Requisition>>(`/requisitions/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  cancel: async (id: string): Promise<ApiResponse<Requisition>> => {
    const response = await api.post<ApiResponse<Requisition>>(`/requisitions/${id}/cancel`);
    return response.data;
  },
};
