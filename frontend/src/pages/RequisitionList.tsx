import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requisitionService } from '@/services/requisitionService';
import { useAuth } from '@/context/AuthContext';
import { Plus, Eye } from 'lucide-react';

const RequisitionList = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['requisitions'],
    queryFn: () => requisitionService.getAll(),
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'badge-gray',
      pending: 'badge-info',
      in_approval: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      cancelled: 'badge-gray',
      partially_ordered: 'badge-warning',
      ordered: 'badge-success',
    };
    return badges[status] || 'badge-gray';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      pending: 'Pendiente',
      in_approval: 'En Aprobación',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      cancelled: 'Cancelada',
      partially_ordered: 'Parcialmente Ordenada',
      ordered: 'Ordenada',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Requisiciones</h1>
        {(user?.role === 'requester' || user?.role === 'admin') && (
          <Link to="/requisitions/new" className="btn btn-primary inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Requisición
          </Link>
        )}
      </div>

      <div className="card">
        {data?.data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No hay requisiciones registradas</p>
            {(user?.role === 'requester' || user?.role === 'admin') && (
              <Link to="/requisitions/new" className="btn btn-primary inline-flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Crear Primera Requisición
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Folio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.data.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                      {req.requisitionNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.department.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${req.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadge(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${req.priority === 'urgent' ? 'badge-danger' :
                          req.priority === 'high' ? 'badge-warning' :
                            req.priority === 'medium' ? 'badge-info' :
                              'badge-gray'
                        }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.requestDate).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/requisitions/${req.id}`}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequisitionList;
