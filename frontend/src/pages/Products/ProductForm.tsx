import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, CreateProductData } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { supplierService } from '@/services/supplierService';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<CreateProductData>({
        code: '',
        name: '',
        description: '',
        category: '',
        unitOfMeasure: 'pieza',
        unitPrice: 0,
        currency: 'MXN',
        minStock: 0,
        maxStock: 0,
        currentStock: 0,
        reorderPoint: 0,
        preferredSupplier: '',
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getAll(),
    });

    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => supplierService.getAll(),
    });

    useQuery({
        queryKey: ['product', id],
        queryFn: () => productService.getById(id!),
        enabled: isEditing,
        // @ts-ignore
        onSuccess: (data: any) => {
            if (data && data.success) {
                const product = data.data;
                setFormData({
                    code: product.code,
                    name: product.name,
                    description: product.description || '',
                    category: product.category?.id || product.category || '',
                    unitOfMeasure: product.unitOfMeasure,
                    unitPrice: product.unitPrice,
                    currency: product.currency,
                    minStock: product.minStock,
                    maxStock: product.maxStock || 0,
                    currentStock: product.currentStock,
                    reorderPoint: product.reorderPoint,
                    preferredSupplier: product.preferredSupplier?.id || product.preferredSupplier || '',
                });
            }
        },
    });

    useEffect(() => {
        if (isEditing) {
            productService.getById(id!).then((response) => {
                if (response.success && response.data) {
                    const product = response.data;
                    setFormData({
                        code: product.code,
                        name: product.name,
                        description: product.description || '',
                        category: product.category?.id || (typeof product.category === 'string' ? product.category : '') || '',
                        unitOfMeasure: product.unitOfMeasure,
                        unitPrice: product.unitPrice,
                        currency: product.currency,
                        minStock: product.minStock,
                        maxStock: product.maxStock || 0,
                        currentStock: product.currentStock,
                        reorderPoint: product.reorderPoint,
                        preferredSupplier: product.preferredSupplier?.id || (typeof product.preferredSupplier === 'string' ? product.preferredSupplier : '') || '',
                    });
                }
            });
        }
    }, [id, isEditing]);

    const createMutation = useMutation({
        mutationFn: (data: CreateProductData) => productService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto creado exitosamente');
            navigate('/products');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear producto');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreateProductData>) => productService.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', id] });
            toast.success('Producto actualizado exitosamente');
            navigate('/products');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar producto');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['unitPrice', 'minStock', 'maxStock', 'currentStock', 'reorderPoint'].includes(name)
                ? parseFloat(value) || 0
                : value
        }));
    };

    return (
        <div>
            <button
                onClick={() => navigate('/products')}
                className="btn btn-secondary mb-6 inline-flex items-center"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>

            <form onSubmit={handleSubmit} className="card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Información General</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código *
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            className="input"
                            required
                            placeholder="SKU-123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Producto *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="input"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="">Seleccione una categoría</option>
                            {// @ts-ignore
                                categories?.data.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Proveedor Preferido
                        </label>
                        <select
                            name="preferredSupplier"
                            value={formData.preferredSupplier}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">Seleccione proveedor (opcional)</option>
                            {// @ts-ignore
                                suppliers?.data.map((sup: any) => (
                                    <option key={sup.id} value={sup.id}>
                                        {sup.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Pricing & Stock */}
                    <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Precios e Inventario</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio Unitario *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                name="unitPrice"
                                value={formData.unitPrice}
                                onChange={handleChange}
                                className="input pl-7"
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unidad de Medida *
                        </label>
                        <select
                            name="unitOfMeasure"
                            value={formData.unitOfMeasure}
                            onChange={handleChange}
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
                            Stock Actual
                        </label>
                        <input
                            type="number"
                            name="currentStock"
                            value={formData.currentStock}
                            onChange={handleChange}
                            className="input"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Punto de Reorden
                        </label>
                        <input
                            type="number"
                            name="reorderPoint"
                            value={formData.reorderPoint}
                            onChange={handleChange}
                            className="input"
                            min="0"
                            step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">Stock mínimo antes de alerta</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stock Mínimo
                        </label>
                        <input
                            type="number"
                            name="minStock"
                            value={formData.minStock}
                            onChange={handleChange}
                            className="input"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stock Máximo
                        </label>
                        <input
                            type="number"
                            name="maxStock"
                            value={formData.maxStock}
                            onChange={handleChange}
                            className="input"
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="btn btn-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary inline-flex items-center"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {isEditing ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
