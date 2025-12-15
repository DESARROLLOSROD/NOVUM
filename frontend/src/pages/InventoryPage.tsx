import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInventory } from '@/services/inventoryService';
import { useAuth } from '@/context/AuthContext';
import { IInventoryItem } from '@/types/inventory';
import Modal from '@/components/Modal';
import AddInventoryItemForm from '@/components/inventory/AddInventoryItemForm';
import UpdateInventoryQuantityForm from '@/components/inventory/UpdateInventoryQuantityForm';
import { AlertTriangle, Plus, Edit } from 'lucide-react';

const InventoryPage = () => {
  const { user } = useAuth();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IInventoryItem | null>(null);

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });

  const handleOpenUpdateModal = (item: IInventoryItem) => {
    setSelectedItem(item);
    setUpdateModalOpen(true);
  };

  const getStockStatusBadge = (quantity: number) => {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusLabel = (quantity: number) => {
    if (quantity === 0) return 'Agotado';
    if (quantity < 10) return 'Stock Bajo';
    return 'En Stock';
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando inventario...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error al cargar el inventario</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        { (user?.role === 'admin' || user?.role === 'purchasing') && (
            <button onClick={() => setAddModalOpen(true)} className="btn btn-primary inline-flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Añadir Artículo
            </button>
        )}
      </div>

      <div className="card">
        {inventory?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No hay artículos en el inventario.</p>
            { (user?.role === 'admin' || user?.role === 'purchasing') && (
                <button onClick={() => setAddModalOpen(true)} className="btn btn-primary inline-flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Añadir Primer Artículo
                </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory?.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product.name} ({item.product.code})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.department.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {item.quantity} {item.product.unitOfMeasure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockStatusBadge(item.quantity)}`}>
                        {getStockStatusLabel(item.quantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => handleOpenUpdateModal(item)} className="text-primary-600 hover:text-primary-900 inline-flex items-center">
                        <Edit className="w-4 h-4 mr-1" />
                        Ajustar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Añadir Artículo al Inventario">
        <AddInventoryItemForm onSuccess={() => setAddModalOpen(false)} />
      </Modal>

      {selectedItem && (
        <Modal isOpen={isUpdateModalOpen} onClose={() => setUpdateModalOpen(false)} title="Actualizar Cantidad de Inventario">
            <UpdateInventoryQuantityForm item={selectedItem} onSuccess={() => setUpdateModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default InventoryPage;
