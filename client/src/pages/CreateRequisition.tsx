import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { requisitionService } from '@/services/requisitionService';
import { CreateRequisitionData, RequisitionItem } from '@/types';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateRequisition = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [items, setItems] = useState<Omit<RequisitionItem, 'itemNumber' | 'totalPrice'>[]>([
    {
      description: '',
      category: '',
      quantity: 1,
      unit: 'pieza',
      estimatedPrice: 0,
    },
  ]);

  const createMutation = useMutation({
    mutationFn: (data: CreateRequisitionData) => requisitionService.create(data),
    onSuccess: () => {
      toast.success('Requisición creada exitosamente');
      navigate('/requisitions');
    },
    onError: () => {
      toast.error('Error al crear la requisición');
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      {
        description: '',
        category: '',
        quantity: 1,
        unit: 'pieza',
        estimatedPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !requiredDate || items.length === 0) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    const data: CreateRequisitionData = {
      title,
      description,
      requiredDate,
      priority,
      items,
    };

    createMutation.mutate(data);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.estimatedPrice), 0);

  return (
    <div>
      <button
        onClick={() => navigate('/requisitions')}
        className="btn btn-secondary mb-6 inline-flex items-center"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nueva Requisición</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                required
                placeholder="Título de la requisición"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Requerida *
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="input"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="input"
                required
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={3}
                placeholder="Descripción adicional (opcional)"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Artículos</h2>
            <button type="button" onClick={addItem} className="btn btn-primary inline-flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Artículo
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Artículo {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="input"
                      required
                      placeholder="Descripción del artículo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      className="input"
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad *
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      className="input"
                      required
                    >
                      <option value="pieza">Pieza</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                      <option value="litro">Litro</option>
                      <option value="kg">Kilogramo</option>
                      <option value="metro">Metro</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Estimado *
                    </label>
                    <input
                      type="number"
                      value={item.estimatedPrice}
                      onChange={(e) => updateItem(index, 'estimatedPrice', parseFloat(e.target.value))}
                      className="input"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Justificación
                    </label>
                    <input
                      type="text"
                      value={item.justification || ''}
                      onChange={(e) => updateItem(index, 'justification', e.target.value)}
                      className="input"
                      placeholder="Justificación (opcional)"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="text-right w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtotal
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        ${(item.quantity * item.estimatedPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-primary-600">
                  ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/requisitions')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn btn-primary"
          >
            {createMutation.isPending ? 'Creando...' : 'Crear Requisición'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequisition;
