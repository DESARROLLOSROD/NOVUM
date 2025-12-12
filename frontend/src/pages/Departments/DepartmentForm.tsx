import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService, CreateDepartmentData } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const DepartmentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<CreateDepartmentData>({
        name: '',
        code: '',
        costCenter: '',
        manager: '',
    });

    const { data: users } = useQuery({
        queryKey: ['users', 'active'],
        queryFn: () => userService.getAll({ isActive: true }),
    });

    useQuery({
        queryKey: ['department', id],
        queryFn: () => departmentService.getById(id!),
        enabled: isEditing,
        // @ts-ignore
        onSuccess: (data: any) => {
            if (data && data.success) {
                const dept = data.data;
                setFormData({
                    name: dept.name,
                    code: dept.code,
                    costCenter: dept.costCenter,
                    manager: dept.manager?.id || (typeof dept.manager === 'string' ? dept.manager : '') || '',
                });
            }
        },
    });

    useEffect(() => {
        if (isEditing) {
            departmentService.getById(id!).then((response) => {
                if (response.success && response.data) {
                    const dept = response.data;
                    setFormData({
                        name: dept.name,
                        code: dept.code,
                        costCenter: dept.costCenter,
                        manager: dept.manager?.id || (typeof dept.manager === 'string' ? dept.manager : '') || '',
                    });
                }
            });
        }
    }, [id, isEditing]);

    const createMutation = useMutation({
        mutationFn: (data: CreateDepartmentData) => departmentService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Departamento creado exitosamente');
            navigate('/departments');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear departamento');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreateDepartmentData>) => departmentService.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            queryClient.invalidateQueries({ queryKey: ['department', id] });
            toast.success('Departamento actualizado exitosamente');
            navigate('/departments');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar departamento');
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div>
            <button
                onClick={() => navigate('/departments')}
                className="btn btn-secondary mb-6 inline-flex items-center"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Editar Departamento' : 'Nuevo Departamento'}
            </h1>

            <form onSubmit={handleSubmit} className="card max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Departamento *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                            required
                            placeholder="Ej. Recursos Humanos"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                placeholder="Ej. HR"
                                maxLength={10}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Identificador único corto (máx. 10 caracteres)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Centro de Costos *
                            </label>
                            <input
                                type="text"
                                name="costCenter"
                                value={formData.costCenter}
                                onChange={handleChange}
                                className="input"
                                required
                                placeholder="Ej. CC-001"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Manager
                        </label>
                        <select
                            name="manager"
                            value={formData.manager}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">Seleccione un manager (opcional)</option>
                            {users?.data.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/departments')}
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
                </div>
            </form>
        </div>
    );
};

export default DepartmentForm;
