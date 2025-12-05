import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface PurchaseOrder {
    id: string;
    orderNumber: string;
    requisitions: string[];
    supplier: {
        id: string;
        name: string;
        code: string;
    };
    buyer: {
        id: string;
        firstName: string;
        lastName: string;
        employeeCode: string;
    };
    department: {
        id: string;
        name: string;
        code: string;
    };
    status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'cancelled';
    orderDate: string;
    expectedDeliveryDate: string;
    deliveryAddress: string;
    paymentTerms: string;
    items: PurchaseOrderItem[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    notes?: string;
    approvedBy?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    approvalDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PurchaseOrderItem {
    itemNumber: number;
    description: string;
    category: {
        id: string;
        name: string;
        code: string;
    };
    quantity: number;
    unit: string;
    unitPrice: number;
    tax: number;
    discount: number;
    totalPrice: number;
    requisitionRef?: string;
    requisitionItemNumber?: number;
}

export interface CreatePurchaseOrderData {
    requisitions?: string[];
    supplier: string;
    expectedDeliveryDate: string;
    deliveryAddress: string;
    paymentTerms: string;
    items: {
        description: string;
        category: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        tax?: number;
        discount?: number;
        requisitionRef?: string;
        requisitionItemNumber?: number;
    }[];
    notes?: string;
}

export interface PurchaseOrderFilters {
    page?: number;
    limit?: number;
    status?: string;
    supplier?: string;
    department?: string;
    search?: string;
}

export const getPurchaseOrders = async (
    filters?: PurchaseOrderFilters
): Promise<PaginatedResponse<PurchaseOrder>> => {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplier) params.append('supplier', filters.supplier);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get<PaginatedResponse<PurchaseOrder>>(
        `/purchase-orders?${params.toString()}`
    );
    return response.data;
};

export const getPurchaseOrderById = async (id: string): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return response.data;
};

export const createPurchaseOrder = async (
    data: CreatePurchaseOrderData
): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await api.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data);
    return response.data;
};

export const updatePurchaseOrder = async (
    id: string,
    data: Partial<CreatePurchaseOrderData>
): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await api.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, data);
    return response.data;
};

export const deletePurchaseOrder = async (id: string): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await api.delete<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return response.data;
};

export const approvePurchaseOrder = async (id: string): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/approve`);
    return response.data;
};

export const sendPurchaseOrder = async (id: string): Promise<ApiResponse<PurchaseOrder>> => {
    const response = await api.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/send`);
    return response.data;
};
