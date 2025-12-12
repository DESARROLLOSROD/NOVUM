import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/departmentService';
import { Plus, Edit, Trash2, Search, RefreshCw, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const DepartmentList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['departments', searchTerm],
        queryFn: () => departmentService.getAll({ search: searchTerm }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => departmentService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Departamento desactivado exitosamente');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al desactivar departamento');
        },
    });

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de que deseas desactivar este departamento?')) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return <div className="text-center py-12">Cargando...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Departamentos</h1>
                <Link to="/departments/new" className="btn btn-primary inline-flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Departamento
                </Link>
            </div>

            <div className="card mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, código o centro de costos..."
                            className="input pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
                        className="btn btn-secondary"
                        title="Recargar"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.data.map((dept) => (
                    <div key={dept.id} className="card hover:shadow-lg transition-shadow duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                <div className="bg-primary-100 p-2 rounded-lg">
                                    <Building className="w-6 h-6 text-primary-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                                    <p className="text-sm text-gray-500 font-mono">{dept.code}</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {dept.isActive ? 'Activo' : 'Inactivo'}
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Centro de Costos:</span>
                                <span className="font-medium">{dept.costCenter}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Manager:</span>
                                <span className="font-medium">
                                    {dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
                            <Link
                                to={`/departments/${dept.id}`}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit className="w-5 h-5" />
                            </Link>
                            {dept.isActive && (
                                <button
                                    onClick={() => handleDelete(dept.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {data?.data.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No se encontraron departamentos.
                </div>
            )}
        </div>
    );
};

export default DepartmentList;
