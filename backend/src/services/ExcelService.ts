import * as XLSX from 'xlsx';
import { IRequisition } from '../models/Requisition';
import logger from '../config/logger';

class ExcelService {
  async generateRequisitionsExcel(requisitions: IRequisition[]): Promise<Buffer> {
    try {
      // Crear workbook
      const wb = XLSX.utils.book_new();

      // Preparar datos para la hoja de resumen
      const summaryData = requisitions.map((req: any) => ({
        'Número': req.requisitionNumber,
        'Estado': req.status,
        'Prioridad': req.priority,
        'Solicitante': `${req.requester.firstName} ${req.requester.lastName}`,
        'Departamento': req.department.name,
        'Fecha Solicitud': new Date(req.requestDate).toLocaleDateString('es-ES'),
        'Fecha Requerida': new Date(req.requiredDate).toLocaleDateString('es-ES'),
        'Título': req.title,
        'Total Items': req.items.length,
        'Monto Total': req.totalAmount,
      }));

      // Crear hoja de resumen
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);

      // Aplicar formato a las columnas
      wsSummary['!cols'] = [
        { wch: 15 }, // Número
        { wch: 15 }, // Estado
        { wch: 12 }, // Prioridad
        { wch: 25 }, // Solicitante
        { wch: 20 }, // Departamento
        { wch: 15 }, // Fecha Solicitud
        { wch: 15 }, // Fecha Requerida
        { wch: 40 }, // Título
        { wch: 12 }, // Total Items
        { wch: 15 }, // Monto Total
      ];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

      // Preparar datos para la hoja de items detallados
      const itemsData: any[] = [];
      requisitions.forEach((req: any) => {
        req.items.forEach((item: any) => {
          itemsData.push({
            'Requisición': req.requisitionNumber,
            'Estado Req.': req.status,
            'Departamento': req.department.name,
            'Item #': item.itemNumber,
            'Descripción': item.description,
            'Categoría': item.category?.name || 'N/A',
            'Cantidad': item.quantity,
            'Unidad': item.unit,
            'Precio Estimado': item.estimatedPrice,
            'Total Item': item.totalPrice,
            'Especificaciones': item.specifications || '',
          });
        });
      });

      const wsItems = XLSX.utils.json_to_sheet(itemsData);

      // Aplicar formato a las columnas
      wsItems['!cols'] = [
        { wch: 15 }, // Requisición
        { wch: 15 }, // Estado Req.
        { wch: 20 }, // Departamento
        { wch: 8 },  // Item #
        { wch: 40 }, // Descripción
        { wch: 20 }, // Categoría
        { wch: 10 }, // Cantidad
        { wch: 10 }, // Unidad
        { wch: 15 }, // Precio Estimado
        { wch: 15 }, // Total Item
        { wch: 50 }, // Especificaciones
      ];

      XLSX.utils.book_append_sheet(wb, wsItems, 'Items Detallados');

      // Crear hoja de estadísticas
      const stats = this.calculateStats(requisitions);
      const statsData = [
        { 'Métrica': 'Total Requisiciones', 'Valor': stats.total },
        { 'Métrica': 'Requisiciones Pendientes', 'Valor': stats.pending },
        { 'Métrica': 'Requisiciones en Aprobación', 'Valor': stats.inApproval },
        { 'Métrica': 'Requisiciones Aprobadas', 'Valor': stats.approved },
        { 'Métrica': 'Requisiciones Rechazadas', 'Valor': stats.rejected },
        { 'Métrica': 'Monto Total', 'Valor': stats.totalAmount },
        { 'Métrica': 'Monto Promedio', 'Valor': stats.avgAmount },
        { 'Métrica': 'Total Items', 'Valor': stats.totalItems },
      ];

      const wsStats = XLSX.utils.json_to_sheet(statsData);
      wsStats['!cols'] = [
        { wch: 30 }, // Métrica
        { wch: 20 }, // Valor
      ];

      XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');

      // Generar buffer
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      logger.info(`Excel generado con ${requisitions.length} requisiciones`);

      return excelBuffer;
    } catch (error) {
      logger.error('Error generando Excel:', error);
      throw new Error('Error al generar el archivo Excel');
    }
  }

  async generateSingleRequisitionExcel(requisition: IRequisition): Promise<Buffer> {
    try {
      const wb = XLSX.utils.book_new();

      // Información general
      const req: any = requisition;
      const generalInfo = [
        { 'Campo': 'Número de Requisición', 'Valor': req.requisitionNumber },
        { 'Campo': 'Estado', 'Valor': req.status },
        { 'Campo': 'Prioridad', 'Valor': req.priority },
        {
          'Campo': 'Solicitante',
          'Valor': `${req.requester.firstName} ${req.requester.lastName}`,
        },
        { 'Campo': 'Email Solicitante', 'Valor': req.requester.email },
        { 'Campo': 'Departamento', 'Valor': req.department.name },
        { 'Campo': 'Centro de Costos', 'Valor': req.department.costCenter },
        {
          'Campo': 'Fecha de Solicitud',
          'Valor': new Date(req.requestDate).toLocaleDateString('es-ES'),
        },
        {
          'Campo': 'Fecha Requerida',
          'Valor': new Date(req.requiredDate).toLocaleDateString('es-ES'),
        },
        { 'Campo': 'Título', 'Valor': req.title },
        { 'Campo': 'Descripción', 'Valor': req.description || 'N/A' },
        { 'Campo': 'Monto Total', 'Valor': req.totalAmount },
      ];

      const wsGeneral = XLSX.utils.json_to_sheet(generalInfo);
      wsGeneral['!cols'] = [
        { wch: 25 }, // Campo
        { wch: 50 }, // Valor
      ];
      XLSX.utils.book_append_sheet(wb, wsGeneral, 'Información General');

      // Items
      const itemsData = req.items.map((item: any) => ({
        'Item #': item.itemNumber,
        'Descripción': item.description,
        'Categoría': item.category?.name || 'N/A',
        'Cantidad': item.quantity,
        'Unidad': item.unit,
        'Precio Estimado': item.estimatedPrice,
        'Total': item.totalPrice,
        'Especificaciones': item.specifications || '',
        'Justificación': item.justification || '',
      }));

      const wsItems = XLSX.utils.json_to_sheet(itemsData);
      wsItems['!cols'] = [
        { wch: 8 },  // Item #
        { wch: 40 }, // Descripción
        { wch: 20 }, // Categoría
        { wch: 10 }, // Cantidad
        { wch: 10 }, // Unidad
        { wch: 15 }, // Precio Estimado
        { wch: 15 }, // Total
        { wch: 40 }, // Especificaciones
        { wch: 40 }, // Justificación
      ];
      XLSX.utils.book_append_sheet(wb, wsItems, 'Items');

      // Historial de aprobación
      if (req.approvalHistory && req.approvalHistory.length > 0) {
        const approvalData = req.approvalHistory.map((approval: any) => ({
          'Nivel': approval.level,
          'Estado': approval.status,
          'Aprobador': approval.approver
            ? `${approval.approver.firstName} ${approval.approver.lastName}`
            : 'Pendiente',
          'Fecha': approval.date
            ? new Date(approval.date).toLocaleDateString('es-ES')
            : 'N/A',
          'Comentarios': approval.comments || '',
        }));

        const wsApproval = XLSX.utils.json_to_sheet(approvalData);
        wsApproval['!cols'] = [
          { wch: 8 },  // Nivel
          { wch: 15 }, // Estado
          { wch: 25 }, // Aprobador
          { wch: 15 }, // Fecha
          { wch: 50 }, // Comentarios
        ];
        XLSX.utils.book_append_sheet(wb, wsApproval, 'Historial de Aprobación');
      }

      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      logger.info(`Excel generado para requisición ${req.requisitionNumber}`);

      return excelBuffer;
    } catch (error) {
      logger.error('Error generando Excel:', error);
      throw new Error('Error al generar el archivo Excel');
    }
  }

  private calculateStats(requisitions: IRequisition[]): any {
    return {
      total: requisitions.length,
      pending: requisitions.filter((r) => r.status === 'pending').length,
      inApproval: requisitions.filter((r) => r.status === 'in_approval').length,
      approved: requisitions.filter((r) => r.status === 'approved').length,
      rejected: requisitions.filter((r) => r.status === 'rejected').length,
      totalAmount: requisitions.reduce((sum, r) => sum + r.totalAmount, 0),
      avgAmount:
        requisitions.length > 0
          ? requisitions.reduce((sum, r) => sum + r.totalAmount, 0) / requisitions.length
          : 0,
      totalItems: requisitions.reduce((sum, r) => sum + r.items.length, 0),
    };
  }
}

export default new ExcelService();
