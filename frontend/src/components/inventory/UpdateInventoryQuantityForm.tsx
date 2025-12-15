import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInventoryQuantity } from '../../services/inventoryService';
import { IInventoryItem, UpdateInventoryQuantityData } from '../../types/inventory';
import toast from 'react-hot-toast';

interface UpdateInventoryQuantityFormProps {
  item: IInventoryItem;
  onSuccess: () => void;
}

const UpdateInventoryQuantityForm: React.FC<UpdateInventoryQuantityFormProps> = ({ item, onSuccess }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateInventoryQuantityData>({
    defaultValues: {
      quantity: item.quantity,
      location: item.location,
    }
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateInventoryQuantityData) => updateInventoryQuantity(item._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Cantidad actualizada');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const onSubmit = (data: UpdateInventoryQuantityData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <p className="mb-4 text-sm text-gray-700">
            <strong>Producto:</strong> {item.product.name} ({item.product.code}) <br />
            <strong>Departamento:</strong> {item.department.name}
        </p>

      <div className="mb-4">
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Nueva Cantidad</label>
        <input type="number" id="quantity" {...register('quantity', { required: 'La cantidad es requerida', min: 0 })} className="mt-1 block w-full" />
        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Nueva Ubicación (Opcional)</label>
        <input type="text" id="location" {...register('location')} className="mt-1 block w-full" />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>
          {mutation.isLoading ? 'Actualizando...' : 'Actualizar Cantidad'}
        </button>
      </div>
    </form>
  );
};

export default UpdateInventoryQuantityForm;
