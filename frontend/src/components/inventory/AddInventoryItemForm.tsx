import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addInventoryItem } from '@/services/inventoryService';
import { productService } from '@/services/productService';
import { departmentService } from '@/services/departmentService';
import { AddInventoryItemData } from '@/types/inventory';
import toast from 'react-hot-toast';

interface AddInventoryItemFormProps {
  onSuccess: () => void;
}

const AddInventoryItemForm: React.FC<AddInventoryItemFormProps> = ({ onSuccess }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<AddInventoryItemData>();

  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productService.getAll() });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => departmentService.getAll() });

  const mutation = useMutation({
    mutationFn: addInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Artículo añadido al inventario');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const onSubmit = (data: AddInventoryItemData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-4">
        <label htmlFor="product" className="block text-sm font-medium text-gray-700">Producto</label>
        <select id="product" {...register('product', { required: 'El producto es requerido' })} className="mt-1 block w-full">
          <option value="">Selecciona un producto</option>
          {products?.data.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {errors.product && <p className="text-red-500 text-xs mt-1">{errors.product.message}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">Departamento</label>
        <select id="department" {...register('department', { required: 'El departamento es requerido' })} className="mt-1 block w-full">
          <option value="">Selecciona un departamento</option>
          {departments?.data.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Cantidad</label>
        <input type="number" id="quantity" {...register('quantity', { required: 'La cantidad es requerida', min: 0 })} className="mt-1 block w-full" />
        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación (Opcional)</label>
        <input type="text" id="location" {...register('location')} className="mt-1 block w-full" />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>
          {mutation.isLoading ? 'Añadiendo...' : 'Añadir Artículo'}
        </button>
      </div>
    </form>
  );
};

export default AddInventoryItemForm;
