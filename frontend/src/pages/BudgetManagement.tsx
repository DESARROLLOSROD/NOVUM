import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService, UpdateBudgetData } from '@/services/budgetService';
import BudgetProgressBar from '@/components/budget/BudgetProgressBar';
import { Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const BudgetManagement = () => {
  const queryClient = useQueryClient();
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState({
    annual: 0,
    alerts: [] as Array<{ percentage: number }>,
    fiscalYear: new Date().getFullYear(),
  });

  const { data: budgetsSummary, isLoading } = useQuery({
    queryKey: ['budgets-summary'],
    queryFn: () => budgetService.getBudgetsSummary(),
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ departmentId, data }: { departmentId: string; data: UpdateBudgetData }) =>
      budgetService.updateDepartmentBudget(departmentId, data),
    onSuccess: () => {
      toast.success('Presupuesto actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['budgets-summary'] });
      setEditingDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar presupuesto');
    },
  });

  const handleEdit = (departmentId: string, currentBudget: any) => {
    setEditingDepartment(departmentId);
    setBudgetForm({
      annual: currentBudget.annual || 0,
      alerts: currentBudget.alerts || [],
      fiscalYear: currentBudget.fiscalYear || new Date().getFullYear(),
    });
  };

  const handleSave = (departmentId: string) => {
    updateBudgetMutation.mutate({ departmentId, data: budgetForm });
  };

  const handleCancel = () => {
    setEditingDepartment(null);
    setBudgetForm({
      annual: 0,
      alerts: [],
      fiscalYear: new Date().getFullYear(),
    });
  };

  const handleAddAlert = () => {
    setBudgetForm({
      ...budgetForm,
      alerts: [...budgetForm.alerts, { percentage: 75 }],
    });
  };

  const handleRemoveAlert = (index: number) => {
    setBudgetForm({
      ...budgetForm,
      alerts: budgetForm.alerts.filter((_, i) => i !== index),
    });
  };

  const handleAlertChange = (index: number, value: number) => {
    const newAlerts = [...budgetForm.alerts];
    newAlerts[index] = { percentage: value };
    setBudgetForm({ ...budgetForm, alerts: newAlerts });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totals = budgetsSummary?.data.totals || {
    annual: 0,
    spent: 0,
    committed: 0,
    available: 0,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Presupuestos</h1>
        <p className="mt-2 text-gray-600">
          Administra y monitorea los presupuestos departamentales
        </p>
      </div>

      {/* Resumen Total */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Resumen General</h2>
        <BudgetProgressBar
          annual={totals.annual}
          spent={totals.spent}
          committed={totals.committed}
          available={totals.available}
          showDetails={true}
        />
      </div>

      {/* Lista de Departamentos */}
      <div className="space-y-6">
        {budgetsSummary?.data.departments.map((dept) => (
          <div key={dept.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                <p className="text-sm text-gray-600">
                  Código: {dept.code} | Centro de Costos: {dept.costCenter}
                </p>
                {dept.manager && (
                  <p className="text-sm text-gray-500">
                    Manager: {dept.manager.firstName} {dept.manager.lastName}
                  </p>
                )}
              </div>

              {editingDepartment === dept.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(dept.id)}
                    className="btn btn-sm btn-primary"
                    disabled={updateBudgetMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Guardar
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn btn-sm bg-gray-200 hover:bg-gray-300"
                    disabled={updateBudgetMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEdit(dept.id, dept.budget)}
                  className="btn btn-sm btn-primary"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </button>
              )}
            </div>

            {editingDepartment === dept.id ? (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presupuesto Anual
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={budgetForm.annual}
                      onChange={(e) =>
                        setBudgetForm({ ...budgetForm, annual: parseFloat(e.target.value) || 0 })
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año Fiscal
                    </label>
                    <input
                      type="number"
                      min="2020"
                      max="2100"
                      value={budgetForm.fiscalYear}
                      onChange={(e) =>
                        setBudgetForm({ ...budgetForm, fiscalYear: parseInt(e.target.value) || new Date().getFullYear() })
                      }
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Alertas de Presupuesto
                    </label>
                    <button
                      onClick={handleAddAlert}
                      className="btn btn-sm btn-primary"
                      type="button"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Alerta
                    </button>
                  </div>

                  {budgetForm.alerts.map((alert, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alert.percentage}
                        onChange={(e) => handleAlertChange(index, parseFloat(e.target.value) || 0)}
                        className="input flex-1"
                        placeholder="Porcentaje de alerta"
                      />
                      <span className="text-sm text-gray-600">%</span>
                      <button
                        onClick={() => handleRemoveAlert(index)}
                        className="btn btn-sm bg-red-100 hover:bg-red-200 text-red-700"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {budgetForm.alerts.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No hay alertas configuradas
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <BudgetProgressBar
              annual={dept.budget.annual}
              spent={dept.budget.spent}
              committed={dept.budget.committed}
              available={dept.budget.available}
              alerts={dept.budget.alerts}
              showDetails={true}
            />

            {dept.budget.alerts.some((a) => a.triggered) && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">
                  Alertas Activadas:
                </p>
                <ul className="mt-2 space-y-1">
                  {dept.budget.alerts
                    .filter((a) => a.triggered)
                    .map((alert, idx) => (
                      <li key={idx} className="text-sm text-orange-700">
                        - Alerta al {alert.percentage}% activada el{' '}
                        {alert.triggeredDate
                          ? new Date(alert.triggeredDate).toLocaleDateString('es-ES')
                          : 'N/A'}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {budgetsSummary?.data.departments.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No hay departamentos registrados</p>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;
