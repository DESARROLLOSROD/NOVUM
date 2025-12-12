import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, CreateUserData } from '@/services/userService';
import { departmentService } from '@/services/departmentService';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const UserForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id && id !== 'undefined' && id !== 'new';
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<CreateUserData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        employeeCode: '',
        role: 'requester',
        department: '',
        approvalLimit: 0,
    });

    const { data: departments } = useQuery({
        queryKey: ['departments', 'active'],
        queryFn: () => departmentService.getAll({ isActive: true }),
    });

    useQuery({
        queryKey: ['user', id],
        queryFn: () => userService.getById(id!),
        enabled: isEditing,
        // @ts-ignore
        onSuccess: (data: any) => {
            if (data && data.success) {
                const user = data.data;
                setFormData({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    employeeCode: user.employeeCode,
                    role: user.role,
                    department: user.department?.id || user.department || '',
                    approvalLimit: user.approvalLimit || 0,
                });
            }
        },
    });

    // Manually handle data loading for editing since query `onSuccess` is deprecated in v5
    useEffect(() => {
        if (isEditing && id) {
            userService.getById(id).then((response) => {
                if (response.success && response.data) {
                    const user = response.data;
                    setFormData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        employeeCode: user.employeeCode,
                        role: user.role,
                        department: user.department?.id || (typeof user.department === 'string' ? user.department : '') || '',
                        approvalLimit: user.approvalLimit || 0,
                    });
                }
            });
        }
    }, [id, isEditing]);

    const createMutation = useMutation({
        mutationFn: (data: CreateUserData) => userService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario creado exitosamente');
            navigate('/users');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al crear usuario');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<CreateUserData>) => userService.update(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            toast.success('Usuario actualizado exitosamente');
            navigate('/users');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar usuario');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            // Remove password if it's empty during update
            const dataToUpdate = { ...formData };
            if (!dataToUpdate.password) {
                delete dataToUpdate.password;
            }
            updateMutation.mutate(dataToUpdate);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'approvalLimit' ? parseFloat(value) || 0 : value
        }));
    };

    return (
        <div>
            <button
                onClick={() => navigate('/users')}
                className="btn btn-secondary mb-6 inline-flex items-center"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h1>

            <form onSubmit={handleSubmit} className="card max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre *
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellido *
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input"
                            required
                            disabled={isEditing}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {isEditing ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña *'}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input"
                            required={!isEditing}
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código de Empleado *
                        </label>
                        <input
                            type="text"
                            name="employeeCode"
                            value={formData.employeeCode}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol *
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="requester">Solicitante</option>
                            <option value="approver">Aprobador</option>
                            <option value="buyer">Comprador</option>
                            <option value="warehouse">Almacén</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Departamento *
                        </label>
                        <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="">Seleccione un departamento</option>
                            {departments?.data.map(dept => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Límite de Aprobación
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                name="approvalLimit"
                                value={formData.approvalLimit}
                                onChange={handleChange}
                                className="input pl-7"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Monto máximo que puede aprobar automáticamente (solo para aprobadores).
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/users')}
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

export default UserForm;
