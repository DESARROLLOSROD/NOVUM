export type UserRole = 'admin' | 'approver' | 'purchasing' | 'finance' | 'warehouse' | 'requester';

export interface User {
  id: string;
  employeeCode: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: Department;
  approvalLimit?: number;
  lastLogin?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  costCenter: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  parent?: string;
  level: number;
  path: string;
  isActive: boolean;
}

export type RequisitionStatus =
  | 'draft'
  | 'pending'
  | 'in_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'partially_ordered'
  | 'ordered';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface RequisitionItem {
  itemNumber: number;
  description: string;
  category: Category | string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  totalPrice: number;
  justification?: string;
  specifications?: string;
}

export interface ApprovalHistory {
  level: number;
  approver?: User;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  date?: string;
}

export interface Requisition {
  id: string;
  requisitionNumber: string;
  requester: User;
  department: Department;
  status: RequisitionStatus;
  priority: Priority;
  requestDate: string;
  requiredDate: string;
  title: string;
  description?: string;
  items: RequisitionItem[];
  totalAmount: number;
  approvalHistory: ApprovalHistory[];
  currentApprovalLevel: number;
  attachments?: string[];
  rejectionReason?: string;
  purchaseOrders?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequisitionData {
  title: string;
  description?: string;
  requiredDate: string;
  priority: Priority;
  items: Omit<RequisitionItem, 'itemNumber' | 'totalPrice'>[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
