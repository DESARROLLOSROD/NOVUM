import api from './api';

export const exportService = {
  exportRequisitionToPdf: async (requisitionId: string): Promise<Blob> => {
    const response = await api.get(`/requisitions/${requisitionId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportRequisitionToExcel: async (requisitionId: string): Promise<Blob> => {
    const response = await api.get(`/requisitions/${requisitionId}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportRequisitionsToExcel: async (filters?: {
    status?: string;
    department?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Blob> => {
    const response = await api.get('/requisitions/export/excel', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
