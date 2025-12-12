import puppeteer from 'puppeteer';
import { IRequisition } from '../models/Requisition';
import logger from '../config/logger';

class PdfService {
  async generateRequisitionPdf(requisition: IRequisition): Promise<Buffer> {
    try {
      const html = this.generateRequisitionHtml(requisition);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      await browser.close();

      logger.info(`PDF generado para requisición ${requisition.requisitionNumber}`);

      return Buffer.from(pdf);
    } catch (error) {
      logger.error('Error generando PDF:', error);
      throw new Error('Error al generar el PDF');
    }
  }

  private generateRequisitionHtml(requisition: any): string {
    const requester = requisition.requester;
    const department = requisition.department;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
              line-height: 1.6;
            }

            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              margin-bottom: 30px;
            }

            .header h1 {
              font-size: 28px;
              margin-bottom: 10px;
            }

            .header p {
              font-size: 14px;
              opacity: 0.9;
            }

            .info-section {
              margin-bottom: 30px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 20px;
            }

            .info-item {
              background: #f8f9fa;
              padding: 15px;
              border-left: 4px solid #667eea;
            }

            .info-item label {
              font-size: 12px;
              color: #666;
              display: block;
              margin-bottom: 5px;
              text-transform: uppercase;
              font-weight: 600;
            }

            .info-item span {
              font-size: 14px;
              color: #333;
            }

            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }

            .status-pending { background: #fef3c7; color: #92400e; }
            .status-in_approval { background: #dbeafe; color: #1e40af; }
            .status-approved { background: #d1fae5; color: #065f46; }
            .status-rejected { background: #fee2e2; color: #991b1b; }

            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #667eea;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }

            table thead {
              background: #667eea;
              color: white;
            }

            table th, table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e5e7eb;
            }

            table th {
              font-size: 12px;
              text-transform: uppercase;
              font-weight: 600;
            }

            table td {
              font-size: 13px;
            }

            table tbody tr:hover {
              background: #f9fafb;
            }

            .total-section {
              background: #f8f9fa;
              padding: 20px;
              margin-top: 20px;
              text-align: right;
            }

            .total-section p {
              font-size: 20px;
              font-weight: 600;
              color: #667eea;
            }

            .approval-history {
              margin-top: 30px;
            }

            .approval-item {
              background: #f8f9fa;
              padding: 15px;
              margin-bottom: 10px;
              border-left: 4px solid #667eea;
            }

            .approval-item h4 {
              font-size: 14px;
              margin-bottom: 5px;
            }

            .approval-item p {
              font-size: 13px;
              color: #666;
            }

            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REQUISICIÓN DE COMPRA</h1>
            <p>Sistema NOVUM - Gestión de Requisiciones</p>
          </div>

          <div class="info-section">
            <div class="info-grid">
              <div class="info-item">
                <label>Número de Requisición</label>
                <span><strong>${requisition.requisitionNumber}</strong></span>
              </div>
              <div class="info-item">
                <label>Estado</label>
                <span class="status-badge status-${requisition.status}">${requisition.status}</span>
              </div>
              <div class="info-item">
                <label>Fecha de Solicitud</label>
                <span>${new Date(requisition.requestDate).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</span>
              </div>
              <div class="info-item">
                <label>Fecha Requerida</label>
                <span>${new Date(requisition.requiredDate).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</span>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>Solicitante</label>
                <span>${requester.firstName} ${requester.lastName}</span><br>
                <span style="font-size: 12px; color: #666;">${requester.email}</span>
              </div>
              <div class="info-item">
                <label>Departamento</label>
                <span>${department.name}</span><br>
                <span style="font-size: 12px; color: #666;">Código: ${department.code}</span>
              </div>
            </div>

            <div class="info-item" style="margin-top: 20px;">
              <label>Título</label>
              <span><strong>${requisition.title}</strong></span>
            </div>

            ${
              requisition.description
                ? `
            <div class="info-item" style="margin-top: 20px;">
              <label>Descripción</label>
              <span>${requisition.description}</span>
            </div>
            `
                : ''
            }
          </div>

          <h2 class="section-title">Items Solicitados</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Unidad</th>
                <th>Precio Est.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${requisition.items
                .map(
                  (item: any) => `
                <tr>
                  <td>${item.itemNumber}</td>
                  <td>
                    <strong>${item.description}</strong>
                    ${item.specifications ? `<br><small style="color: #666;">${item.specifications}</small>` : ''}
                  </td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td>$${item.estimatedPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                  <td>$${item.totalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="total-section">
            <p>Total: $${requisition.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          </div>

          ${
            requisition.approvalHistory && requisition.approvalHistory.length > 0
              ? `
          <div class="approval-history">
            <h2 class="section-title">Historial de Aprobación</h2>
            ${requisition.approvalHistory
              .map(
                (approval: any) => `
              <div class="approval-item">
                <h4>Nivel ${approval.level} - ${approval.status.toUpperCase()}</h4>
                ${
                  approval.approver
                    ? `
                  <p><strong>Aprobador:</strong> ${approval.approver.firstName} ${approval.approver.lastName}</p>
                  ${approval.date ? `<p><strong>Fecha:</strong> ${new Date(approval.date).toLocaleDateString('es-ES')}</p>` : ''}
                  ${approval.comments ? `<p><strong>Comentarios:</strong> ${approval.comments}</p>` : ''}
                `
                    : '<p>Pendiente de aprobación</p>'
                }
              </div>
            `
              )
              .join('')}
          </div>
          `
              : ''
          }

          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</p>
            <p>Sistema NOVUM - Gestión de Requisiciones y Compras</p>
          </div>
        </body>
      </html>
    `;
  }
}

export default new PdfService();
