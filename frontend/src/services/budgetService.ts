import api from './api';
import { ApiResponse } from '@/types';

export interface BudgetAlert {
  percentage: number;
  triggered: boolean;
  triggeredDate?: string;
}

export interface BudgetData {
  annual: number;
  spent: number;
  committed: number;
  available: number;
  fiscalYear: number;
  alerts: BudgetAlert[];
  lastUpdated: string;
}

export interface DepartmentBudget {
  department: {
    id: string;
    code: string;
    name: string;
    costCenter: string;
  };
  budget: BudgetData;
}

export interface DepartmentBudgetSummary {
  id: string;
  code: string;
  name: string;
  costCenter: string;
  manager?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  budget: BudgetData;
}

export interface BudgetsSummary {
  departments: DepartmentBudgetSummary[];
  totals: {
    annual: number;
    spent: number;
    committed: number;
    available: number;
  };
}

export interface UpdateBudgetData {
  annual?: number;
  alerts?: Array<{ percentage: number }>;
  fiscalYear?: number;
}

export const budgetService = {
  getDepartmentBudget: async (departmentId: string): Promise<ApiResponse<DepartmentBudget>> => {
    const response = await api.get<ApiResponse<DepartmentBudget>>(
      `/budgets/departments/${departmentId}`
    );
    return response.data;
  },

  updateDepartmentBudget: async (
    departmentId: string,
    data: UpdateBudgetData
  ): Promise<ApiResponse<DepartmentBudget>> => {
    const response = await api.put<ApiResponse<DepartmentBudget>>(
      `/budgets/departments/${departmentId}`,
      data
    );
    return response.data;
  },

  getBudgetsSummary: async (): Promise<ApiResponse<BudgetsSummary>> => {
    const response = await api.get<ApiResponse<BudgetsSummary>>('/budgets/summary');
    return response.data;
  },
};
