import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requisitionService } from '@/services/requisitionService';
import { exportService } from '@/services/exportService';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Ban, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const RequisitionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['requisition', id],
    queryFn: () => requisitionService.getById(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => requisitionService.approve(id!, comments),
    onSuccess: () => {
      toast.success('Requisición aprobada');
      queryClient.invalidateQueries({ queryKey: ['requisition', id] });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      setShowApproveModal(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => requisitionService.reject(id!, rejectReason),
    onSuccess: () => {
      toast.success('Requisición rechazada');
      queryClient.invalidateQueries({ queryKey: ['requisition', id] });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      setShowRejectModal(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => requisitionService.cancel(id!),
    onSuccess: () => {
      toast.success('Requisición cancelada');
      queryClient.invalidateQueries({ queryKey: ['requisition', id] });
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
    },
  });

  const handleExportPdf = async () => {
    try {
      toast.loading('Generando PDF...');
      const blob = await exportService.exportRequisitionToPdf(id!);
      exportService.downloadFile(blob, `requisicion-${requisition?.requisitionNumber}.pdf`);
      toast.dismiss();
      toast.success('PDF descargado');
    } catch (error) {
      toast.dismiss();
      toast.error('Error al generar PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.loading('Generando Excel...');
      const blob = await exportService.exportRequisitionToExcel(id!);
      exportService.downloadFile(blob, `requisicion-${requisition?.requisitionNumber}.xlsx`);
      toast.dismiss();
      toast.success('Excel descargado');
    } catch (error) {
      toast.dismiss();
      toast.error('Error al generar Excel');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  const requisition = data?.data;

  if (!requisition) {
    return <div className="text-center py-12">Requisición no encontrada</div>;
  }

  const canApprove = (user?.role === 'approver' || user?.role === 'finance' || user?.role === 'admin') &&
    (requisition.status === 'pending' || requisition.status === 'in_approval');

  const canCancel = user?.id === requisition.requester.id || user?.role === 'admin';

  return (
    <div>
      <button
        onClick={() => navigate('/requisitions')}
        className="btn btn-secondary mb-6 inline-flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </button>

      <div className="card mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{requisition.requisitionNumber}</h1>
            <p className="text-lg text-gray-600 mt-2">{requisition.title}</p>
          </div>
          <span className={`badge text-lg ${
            requisition.status === 'approved' ? 'badge-success' :
            requisition.status === 'rejected' ? 'badge-danger' :
            requisition.status === 'in_approval' ? 'badge-warning' :
            'badge-info'
          }`}>
            {requisition.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600">Solicitante</p>
            <p className="font-medium">{requisition.requester.firstName} {requisition.requester.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Departamento</p>
            <p className="font-medium">{requisition.department.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Prioridad</p>
            <span className={`badge ${
              requisition.priority === 'urgent' ? 'badge-danger' :
              requisition.priority === 'high' ? 'badge-warning' :
              requisition.priority === 'medium' ? 'badge-info' :
              'badge-gray'
            }`}>
              {requisition.priority}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha de Solicitud</p>
            <p className="font-medium">{new Date(requisition.requestDate).toLocaleDateString('es-MX')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha Requerida</p>
            <p className="font-medium">{new Date(requisition.requiredDate).toLocaleDateString('es-MX')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monto Total</p>
            <p className="text-xl font-bold text-primary-600">
              ${requisition.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {requisition.description && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Descripción</p>
            <p className="text-gray-900">{requisition.description}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          {canApprove && (
            <>
              <button
                onClick={() => setShowApproveModal(true)}
                className="btn btn-primary inline-flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobar
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="btn btn-danger inline-flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </button>
            </>
          )}

          {canCancel && requisition.status !== 'ordered' && requisition.status !== 'cancelled' && (
            <button
              onClick={() => {
                if (confirm('¿Está seguro de cancelar esta requisición?')) {
                  cancelMutation.mutate();
                }
              }}
              className="btn btn-secondary inline-flex items-center"
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancelar Requisición
            </button>
          )}

          {/* Botones de exportación */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleExportPdf}
              className="btn bg-red-600 hover:bg-red-700 text-white inline-flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="btn bg-green-600 hover:bg-green-700 text-white inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </button>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Artículos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requisition.items.map((item) => (
                <tr key={item.itemNumber}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.itemNumber}</td>
                  <td className="px-6 py-4 text-sm">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.quantity} {item.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${item.estimatedPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${item.totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Historial de Aprobaciones</h2>
        <div className="space-y-4">
          {requisition.approvalHistory.map((approval) => (
            <div key={approval.level} className="border-l-4 border-gray-300 pl-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Nivel {approval.level}</p>
                  {approval.approver && (
                    <p className="text-sm text-gray-600">
                      {approval.approver.firstName} {approval.approver.lastName}
                    </p>
                  )}
                </div>
                <span className={`badge ${
                  approval.status === 'approved' ? 'badge-success' :
                  approval.status === 'rejected' ? 'badge-danger' :
                  'badge-info'
                }`}>
                  {approval.status}
                </span>
              </div>
              {approval.comments && (
                <p className="text-sm text-gray-600 mt-2">{approval.comments}</p>
              )}
              {approval.date && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(approval.date).toLocaleString('es-MX')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Aprobar Requisición</h3>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="input mb-4"
              rows={3}
              placeholder="Comentarios (opcional)"
            />
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowApproveModal(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="btn btn-primary"
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Rechazar Requisición</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input mb-4"
              rows={3}
              placeholder="Motivo del rechazo *"
              required
            />
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowRejectModal(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || !rejectReason}
                className="btn btn-danger"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequisitionDetail;
