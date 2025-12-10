import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Plus, Eye } from 'lucide-react';
import { getPurchaseOrders } from '@/services/purchaseOrderService';

const PurchaseOrderList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => getPurchaseOrders({ page: 1, limit: 50 }),
  });

  const purchaseOrders = data?.data || [];

  const getStatusBadgeClass = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'sent':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'received':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      pending_approval: 'Pendiente Aprobación',
      approved: 'Aprobada',
      sent: 'Enviada',
      partially_received: 'Parcialmente Recibida',
      received: 'Recibida',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Cargando órdenes de compra...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">
          Error al cargar las órdenes de compra
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Compra</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gestiona todas las órdenes de compra del sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/purchase-orders/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {!purchaseOrders || purchaseOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay órdenes de compra
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando una nueva orden de compra
            </p>
            <div className="mt-6">
              <Link
                to="/purchase-orders/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {purchaseOrders.map((order) => (
              <li key={order.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Folio</span>
                          <h3 className="text-lg font-bold text-primary-600">
                            {order.orderNumber}
                          </h3>
                        </div>
                        <span className={getStatusBadgeClass(order.status)}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>
                          Proveedor: {order.supplier?.name || 'Sin proveedor'}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          Comprador: {order.buyer?.firstName} {order.buyer?.lastName}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>
                          Monto Total: ${order.totalAmount.toLocaleString('es-MX', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          Creada: {new Date(order.orderDate).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        to={`/purchase-orders/${order.id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderList;
