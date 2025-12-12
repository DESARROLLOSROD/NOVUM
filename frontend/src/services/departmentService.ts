import api from './api';
import { ApiResponse } from '@/types';
import { User } from './userService';

export interface Department {
    id: string;
    name: string;
    code: string;
    costCenter: string;
    manager?: User;
    usersCount?: number;
    isActive: boolean;
}

export interface CreateDepartmentData {
    name: string;
    code: string;
    costCenter: string;
    manager?: string;
}

export interface DepartmentFilters {
    isActive?: boolean;
    search?: string;
}

export const departmentService = {
    getAll: async (filters?: DepartmentFilters) => {
        const params = new URLSearchParams();
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
        if (filters?.search) params.append('search', filters.search);

        const response = await api.get<ApiResponse<Department[]>>(`/departments?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<ApiResponse<Department>>(`/departments/${id}`);
        return response.data;
    },

    create: async (data: CreateDepartmentData) => {
        const response = await api.post<ApiResponse<Department>>('/departments', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateDepartmentData>) => {
        const response = await api.put<ApiResponse<Department>>(`/departments/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<void>>(`/departments/${id}`);
        return response.data;
    }
};
