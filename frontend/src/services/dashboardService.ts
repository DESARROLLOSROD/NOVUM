import api from './api';
import { ApiResponse } from '@/types';

export interface DashboardKPIs {
  totalRequisitions: number;
  pendingRequisitions: number;
  approvedRequisitions: number;
  rejectedRequisitions: number;
  totalSpent: number;
  approvalRate: number;
  avgApprovalTimeHours: number;
}

export interface SpendingTrendData {
  month: string;
  amount: number;
  count: number;
}

export interface CategoryData {
  name: string;
  amount: number;
  count: number;
}

export interface DepartmentData {
  name: string;
  amount: number;
  count: number;
}

export interface DashboardStats {
  kpis: DashboardKPIs;
  charts: {
    spendingTrend: SpendingTrendData[];
    topCategories: CategoryData[];
    byDepartment: DepartmentData[];
  };
}

export const dashboardService = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },
};
