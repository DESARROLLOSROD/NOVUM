import api from './api';
import { ApiResponse } from '@/types';

export interface Category {
    id: string;
    name: string;
    code: string;
    parent?: string;
    level: number;
    path: string;
    isActive: boolean;
}

export const categoryService = {
    getAll: async () => {
        const response = await api.get<ApiResponse<Category[]>>('/categories');
        return response.data;
    }
};
