import api from './api';
import { ApiResponse } from '@/types';

export interface Supplier {
    id: string;
    name: string;
    code: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    paymentTerms?: string;
    isActive: boolean;
}

export interface CreateSupplierData {
    code: string;
    name: string;
    taxId?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export const supplierService = {
    getAll: async () => {
        const response = await api.get<ApiResponse<Supplier[]>>('/suppliers');
        return response.data;
    },

    create: async (data: CreateSupplierData) => {
        const response = await api.post<ApiResponse<Supplier>>('/suppliers', data);
        return response.data;
    }
};
