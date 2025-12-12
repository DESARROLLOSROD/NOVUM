import api from './api';
import { ApiResponse } from '@/types';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'approver' | 'buyer' | 'requester' | 'warehouse';
    department?: {
        id: string;
        name: string;
        code: string;
    };
    employeeCode: string;
    isActive: boolean;
    approvalLimit?: number;
}

export interface CreateUserData {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string;
    employeeCode: string;
    approvalLimit?: number;
}

export interface UserFilters {
    role?: string;
    department?: string;
    isActive?: boolean;
    search?: string;
}

export const userService = {
    getAll: async (filters?: UserFilters) => {
        const params = new URLSearchParams();
        if (filters?.role) params.append('role', filters.role);
        if (filters?.department) params.append('department', filters.department);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
        if (filters?.search) params.append('search', filters.search);

        const response = await api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<ApiResponse<User>>(`/users/${id}`);
        return response.data;
    },

    create: async (data: CreateUserData) => {
        const response = await api.post<ApiResponse<User>>('/users', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateUserData>) => {
        const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
        return response.data;
    },

    resetPassword: async (id: string, newPassword: string) => {
        const response = await api.put<ApiResponse<void>>(`/users/${id}/reset-password`, { newPassword });
        return response.data;
    }
};
