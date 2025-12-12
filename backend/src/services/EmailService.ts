import nodemailer, { Transporter } from 'nodemailer';
import logger from '../config/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    // Configurar transporter (usando Gmail como ejemplo)
    // En producción, usar credenciales reales desde .env
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verificar conexión
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        await this.transporter.verify();
        logger.info('Email service configured successfully');
      } else {
        logger.warn('Email credentials not configured. Email notifications will be disabled.');
      }
    } catch (error) {
      logger.error('Error verifying email connection:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        logger.warn('Email not sent - credentials not configured');
        return false;
      }

      const mailOptions = {
        from: `"NOVUM System" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback a texto plano
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending email to ${options.to}:`, error);
      return false;
    }
  }

  // Templates de emails
  async sendRequisitionApprovedEmail(
    to: string,
    requisitionNumber: string,
    requesterName: string,
    approverName: string,
    comments?: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Requisición Aprobada</h1>
            </div>
            <div class="content">
              <p>Hola ${requesterName},</p>
              <p>Tu requisición <strong>${requisitionNumber}</strong> ha sido aprobada por ${approverName}.</p>
              ${comments ? `<p><strong>Comentarios:</strong> ${comments}</p>` : ''}
              <p>La requisición procederá al siguiente paso del proceso de compras.</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="${process.env.CLIENT_URL}/requisitions/${requisitionNumber}" class="button">Ver Requisición</a>
              </p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático de NOVUM. Por favor no responder a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Requisición ${requisitionNumber} Aprobada`,
      html,
    });
  }

  async sendRequisitionRejectedEmail(
    to: string,
    requisitionNumber: string,
    requesterName: string,
    approverName: string,
    reason: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; }
            .reason-box { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Requisición Rechazada</h1>
            </div>
            <div class="content">
              <p>Hola ${requesterName},</p>
              <p>Tu requisición <strong>${requisitionNumber}</strong> ha sido rechazada por ${approverName}.</p>
              <div class="reason-box">
                <strong>Motivo del rechazo:</strong><br>
                ${reason}
              </div>
              <p>Por favor revisa los comentarios y considera crear una nueva requisición con las correcciones necesarias.</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="${process.env.CLIENT_URL}/requisitions/${requisitionNumber}" class="button">Ver Requisición</a>
              </p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático de NOVUM. Por favor no responder a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Requisición ${requisitionNumber} Rechazada`,
      html,
    });
  }

  async sendApprovalRequiredEmail(
    to: string,
    approverName: string,
    requisitionNumber: string,
    requesterName: string,
    totalAmount: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; }
            .info-box { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Aprobación Requerida</h1>
            </div>
            <div class="content">
              <p>Hola ${approverName},</p>
              <p>Tienes una nueva requisición pendiente de aprobación.</p>
              <div class="info-box">
                <strong>Número de Requisición:</strong> ${requisitionNumber}<br>
                <strong>Solicitante:</strong> ${requesterName}<br>
                <strong>Monto Total:</strong> $${totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p>Por favor revisa y aprueba o rechaza esta requisición a la brevedad.</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="${process.env.CLIENT_URL}/requisitions/${requisitionNumber}" class="button">Revisar Requisición</a>
              </p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático de NOVUM. Por favor no responder a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Aprobación Requerida - Requisición ${requisitionNumber}`,
      html,
    });
  }

  async sendBudgetAlertEmail(
    to: string,
    managerName: string,
    departmentName: string,
    alertPercentage: number,
    spent: number,
    committed: number,
    annual: number
  ): Promise<boolean> {
    const totalUsed = spent + committed;
    const usagePercentage = ((totalUsed / annual) * 100).toFixed(1);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px; }
            .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
            .stat { background-color: white; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Alerta de Presupuesto</h1>
            </div>
            <div class="content">
              <p>Hola ${managerName},</p>
              <div class="alert-box">
                <strong>El presupuesto del departamento ${departmentName} ha alcanzado el ${alertPercentage}% de uso.</strong>
              </div>
              <p>Actualmente se ha utilizado el <strong>${usagePercentage}%</strong> del presupuesto anual.</p>
              <div class="stats">
                <div class="stat">
                  <strong>Gastado:</strong><br>
                  $${spent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
                <div class="stat">
                  <strong>Comprometido:</strong><br>
                  $${committed.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
                <div class="stat">
                  <strong>Total Usado:</strong><br>
                  $${totalUsed.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
                <div class="stat">
                  <strong>Presupuesto Anual:</strong><br>
                  $${annual.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <p>Por favor monitorea el uso del presupuesto para evitar exceder el límite anual.</p>
              <p style="text-align: center; margin-top: 20px;">
                <a href="${process.env.CLIENT_URL}/budgets" class="button">Ver Presupuestos</a>
              </p>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático de NOVUM. Por favor no responder a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Alerta de Presupuesto - ${departmentName} (${alertPercentage}%)`,
      html,
    });
  }
}

export default new EmailService();
