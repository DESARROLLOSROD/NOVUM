import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { requisitionService } from '@/services/requisitionService';
import { dashboardService } from '@/services/dashboardService';
import { FileText, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import SpendingTrendChart from '@/components/charts/SpendingTrendChart';
import TopCategoriesChart from '@/components/charts/TopCategoriesChart';
import DepartmentPieChart from '@/components/charts/DepartmentPieChart';

const Dashboard = () => {
  const { user } = useAuth();

  const { data: requisitions, isLoading: isLoadingRequisitions } = useQuery({
    queryKey: ['requisitions'],
    queryFn: () => requisitionService.getAll({ limit: 100 }),
  });

  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });

  const stats = dashboardStats?.data.kpis || {
    totalRequisitions: 0,
    pendingRequisitions: 0,
    approvedRequisitions: 0,
    rejectedRequisitions: 0,
    totalSpent: 0,
    approvalRate: 0,
    avgApprovalTimeHours: 0,
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'finance';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Dashboard de {user?.role === 'admin' ? 'Administración' : user?.role === 'requester' ? 'Solicitante' : 'Gestión'}
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequisitions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequisitions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedRequisitions}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rechazadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejectedRequisitions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gasto Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-emerald-100 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasa de Aprobación</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvalRate}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgApprovalTimeHours}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {dashboardStats && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Spending Trend */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Tendencia de Gastos (Últimos 6 Meses)</h2>
              {dashboardStats.data.charts.spendingTrend.length > 0 ? (
                <SpendingTrendChart data={dashboardStats.data.charts.spendingTrend} />
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No hay datos disponibles
                </div>
              )}
            </div>

            {/* Top Categories */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Top 5 Categorías</h2>
              {dashboardStats.data.charts.topCategories.length > 0 ? (
                <TopCategoriesChart data={dashboardStats.data.charts.topCategories} />
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Department Distribution - Only for Admin/Finance */}
          {isAdmin && dashboardStats.data.charts.byDepartment.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold mb-4">Distribución por Departamento</h2>
              <DepartmentPieChart data={dashboardStats.data.charts.byDepartment} />
            </div>
          )}
        </>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Requisiciones Recientes</h2>
        {requisitions?.data.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay requisiciones registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requisitions?.data.slice(0, 5).map((req) => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {req.requisitionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {req.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${req.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        req.status === 'approved' ? 'badge-success' :
                        req.status === 'rejected' ? 'badge-danger' :
                        req.status === 'in_approval' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.requestDate).toLocaleDateString()}
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

export default Dashboard;
