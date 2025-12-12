import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface Product {
    id: string;
    code: string;
    name: string;
    description?: string;
    category: {
        id: string;
        name: string;
        code: string;
    };
    unitOfMeasure: string;
    unitPrice: number;
    currency: string;
    minStock: number;
    maxStock?: number;
    currentStock: number;
    reorderPoint: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
    preferredSupplier?: {
        id: string;
        name: string;
        code: string;
    };
    alternativeSuppliers?: Array<{
        id: string;
        name: string;
        code: string;
    }>;
    specifications?: Record<string, string>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductData {
    code: string;
    name: string;
    description?: string;
    category: string;
    unitOfMeasure: string;
    unitPrice: number;
    currency?: string;
    minStock?: number;
    maxStock?: number;
    currentStock?: number;
    reorderPoint?: number;
    preferredSupplier?: string;
    alternativeSuppliers?: string[];
    specifications?: Record<string, string>;
}

export interface ProductFilters {
    page?: number;
    limit?: number;
    category?: string;
    supplier?: string;
    isActive?: boolean;
    search?: string;
    stockStatus?: string;
}

export const productService = {
    getAll: async (filters?: ProductFilters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.category) params.append('category', filters.category);
        if (filters?.supplier) params.append('supplier', filters.supplier);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.stockStatus) params.append('stockStatus', filters.stockStatus);

        const response = await api.get<PaginatedResponse<Product>>(`/products?${params.toString()}`);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
        return response.data;
    },

    create: async (data: CreateProductData) => {
        const response = await api.post<ApiResponse<Product>>('/products', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateProductData>) => {
        const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<void>>(`/products/${id}`);
        return response.data;
    },

    updateStock: async (id: string, quantity: number, operation: 'add' | 'subtract' | 'set') => {
        const response = await api.put<ApiResponse<any>>(`/products/${id}/stock`, { quantity, operation });
        return response.data;
    },

    getLowStock: async () => {
        const response = await api.get<ApiResponse<Product[]>>('/products/alerts/low-stock');
        return response.data;
    }
};
