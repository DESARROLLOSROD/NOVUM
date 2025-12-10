// Status labels and configurations centralized

export const REQUISITION_STATUS = {
  draft: { label: 'Borrador', color: 'gray' },
  pending: { label: 'Pendiente', color: 'yellow' },
  in_approval: { label: 'En Aprobación', color: 'blue' },
  approved: { label: 'Aprobada', color: 'green' },
  rejected: { label: 'Rechazada', color: 'red' },
  cancelled: { label: 'Cancelada', color: 'red' },
  partially_ordered: { label: 'Parcialmente Ordenada', color: 'purple' },
  ordered: { label: 'Ordenada', color: 'green' },
} as const;

export const PURCHASE_ORDER_STATUS = {
  draft: { label: 'Borrador', color: 'gray' },
  pending_approval: { label: 'Pendiente Aprobación', color: 'yellow' },
  approved: { label: 'Aprobada', color: 'blue' },
  sent: { label: 'Enviada', color: 'purple' },
  partially_received: { label: 'Parcialmente Recibida', color: 'orange' },
  received: { label: 'Recibida', color: 'green' },
  cancelled: { label: 'Cancelada', color: 'red' },
} as const;

export const PRIORITY_LABELS = {
  low: { label: 'Baja', color: 'gray' },
  medium: { label: 'Media', color: 'blue' },
  high: { label: 'Alta', color: 'orange' },
  urgent: { label: 'Urgente', color: 'red' },
} as const;

export type RequisitionStatus = keyof typeof REQUISITION_STATUS;
export type PurchaseOrderStatus = keyof typeof PURCHASE_ORDER_STATUS;
export type Priority = keyof typeof PRIORITY_LABELS;

export const getStatusBadgeClass = (status: string, statusMap: typeof REQUISITION_STATUS | typeof PURCHASE_ORDER_STATUS): string => {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
  const statusConfig = statusMap[status as keyof typeof statusMap];

  if (!statusConfig) {
    return `${baseClasses} bg-gray-100 text-gray-800`;
  }

  const colorMap = {
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
  };

  return `${baseClasses} ${colorMap[statusConfig.color]}`;
};

export const getPriorityBadgeClass = (priority: string): string => {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
  const priorityConfig = PRIORITY_LABELS[priority as Priority];

  if (!priorityConfig) {
    return `${baseClasses} bg-gray-100 text-gray-800`;
  }

  const colorMap = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
  };

  return `${baseClasses} ${colorMap[priorityConfig.color]}`;
};
