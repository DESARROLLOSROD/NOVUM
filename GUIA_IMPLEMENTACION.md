# 🛠️ Guía de Implementación - Features Comerciales

## Instrucciones paso a paso para implementar las 4 funcionalidades prioritarias

---

## ✅ Checklist Rápido

- [x] Proyecto reestructurado (backend/frontend/mobile)
- [x] Documentación comercial creada
- [x] Roadmap definido
- [ ] **Feature 1:** Dashboard de Analíticas Avanzado
- [ ] **Feature 2:** Gestión de Presupuestos Departamentales
- [ ] **Feature 3:** Sistema de Notificaciones Email + In-App
- [ ] **Feature 4:** Exportación a PDF y Excel

---

## 📊 Feature 1: Dashboard de Analíticas Avanzado

### **Objetivo:** Crear dashboard visualmente impactante con gráficos y KPIs en tiempo real

### **Tecnologías a usar:**
- Frontend: **Chart.js** (https://www.chartjs.org/) o **Recharts** (https://recharts.org/)
- Backend: Endpoints de estadísticas agregadas

---

### **Paso 1: Instalar dependencias**

```bash
cd frontend
npm install chart.js react-chartjs-2 date-fns
```

---

### **Paso 2: Crear endpoint de estadísticas (Backend)**

**Archivo:** `backend/src/controllers/dashboardController.ts` (CREAR NUEVO)

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Requisition from '../models/Requisition';
import PurchaseOrder from '../models/PurchaseOrder';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Filtro por departamento si no es admin/finance
    const filter: any = {};
    if (!['admin', 'finance', 'purchasing'].includes(user.role)) {
      filter.department = user.department;
    }

    // KPIs básicos
    const totalRequisitions = await Requisition.countDocuments(filter);
    const pendingRequisitions = await Requisition.countDocuments({ ...filter, status: { $in: ['pending', 'in_approval'] } });
    const approvedRequisitions = await Requisition.countDocuments({ ...filter, status: 'approved' });
    const rejectedRequisitions = await Requisition.countDocuments({ ...filter, status: 'rejected' });

    // Total gastado (requisiciones aprobadas)
    const totalSpent = await Requisition.aggregate([
      { $match: { ...filter, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Tendencia de gastos por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const spendingTrend = await Requisition.aggregate([
      { $match: { ...filter, status: 'approved', requestDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$requestDate' },
            month: { $month: '$requestDate' }
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top 5 proveedores
    const topSuppliers = await PurchaseOrder.aggregate([
      { $match: { status: { $in: ['approved', 'sent', 'received'] } } },
      {
        $group: {
          _id: '$supplier',
          totalAmount: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplierData'
        }
      },
      { $unwind: '$supplierData' }
    ]);

    // Distribución por departamento
    const byDepartment = await Requisition.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$department',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentData'
        }
      },
      { $unwind: '$departmentData' },
      { $sort: { total: -1 } }
    ]);

    // Tiempo promedio de aprobación
    const avgApprovalTime = await Requisition.aggregate([
      { $match: { ...filter, status: 'approved' } },
      {
        $project: {
          approvalTime: {
            $subtract: [
              { $arrayElemAt: ['$approvalHistory.date', -1] },
              '$requestDate'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$approvalTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalRequisitions,
          pendingRequisitions,
          approvedRequisitions,
          rejectedRequisitions,
          totalSpent: totalSpent[0]?.total || 0,
          approvalRate: totalRequisitions > 0 ? (approvedRequisitions / totalRequisitions) * 100 : 0,
          avgApprovalTimeHours: avgApprovalTime[0]?.avgTime ? avgApprovalTime[0].avgTime / (1000 * 60 * 60) : 0
        },
        charts: {
          spendingTrend: spendingTrend.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            amount: item.total,
            count: item.count
          })),
          topSuppliers: topSuppliers.map(item => ({
            name: item.supplierData.name,
            amount: item.totalAmount,
            orders: item.orderCount
          })),
          byDepartment: byDepartment.map(item => ({
            name: item.departmentData.name,
            amount: item.total,
            count: item.count
          }))
        }
      }
    });
  } catch (error) {
    throw error;
  }
};
```

---

### **Paso 3: Crear ruta (Backend)**

**Archivo:** `backend/src/routes/dashboardRoutes.ts` (CREAR NUEVO)

```typescript
import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

router.get('/stats', protect, getDashboardStats);

export default router;
```

**Registrar en** `backend/src/app.ts`:

```typescript
import dashboardRoutes from './routes/dashboardRoutes';
app.use('/api/dashboard', dashboardRoutes);
```

---

### **Paso 4: Crear componentes de gráficos (Frontend)**

**Archivo:** `frontend/src/components/charts/SpendingTrendChart.tsx` (CREAR NUEVO)

```typescript
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface SpendingTrendChartProps {
  data: { month: string; amount: number; count: number }[];
}

export const SpendingTrendChart = ({ data }: SpendingTrendChartProps) => {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Gasto Mensual',
        data: data.map(d => d.amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Tendencia de Gastos (Últimos 6 Meses)' }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `$${value.toLocaleString()}`
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
};
```

**Similar para:** `TopSuppliersChart.tsx`, `DepartmentDistributionChart.tsx`

---

### **Paso 5: Actualizar Dashboard (Frontend)**

**Archivo:** `frontend/src/pages/Dashboard.tsx` (MODIFICAR)

```typescript
import { useQuery } from '@tanstack/react-query';
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart';
import { TopSuppliersChart } from '@/components/charts/TopSuppliersChart';
import { DepartmentDistributionChart } from '@/components/charts/DepartmentDistributionChart';
import api from '@/services/api';

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    }
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Requisiciones"
          value={stats?.kpis.totalRequisitions || 0}
          icon={<FileText />}
          color="blue"
        />
        <KPICard
          title="Pendientes"
          value={stats?.kpis.pendingRequisitions || 0}
          icon={<Clock />}
          color="yellow"
        />
        <KPICard
          title="Tasa de Aprobación"
          value={`${stats?.kpis.approvalRate.toFixed(1)}%` || '0%'}
          icon={<CheckCircle />}
          color="green"
        />
        <KPICard
          title="Total Gastado"
          value={`$${stats?.kpis.totalSpent.toLocaleString()}`}
          icon={<DollarSign />}
          color="purple"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SpendingTrendChart data={stats?.charts.spendingTrend || []} />
        </div>
        <div className="card">
          <TopSuppliersChart data={stats?.charts.topSuppliers || []} />
        </div>
      </div>

      <div className="card">
        <DepartmentDistributionChart data={stats?.charts.byDepartment || []} />
      </div>
    </div>
  );
};
```

---

## 💰 Feature 2: Gestión de Presupuestos

### **Paso 1: Extender modelo Department (Backend)**

**Archivo:** `backend/src/models/Department.ts` (MODIFICAR)

```typescript
// AGREGAR campos:
budget: {
  annual: { type: Number, default: 0 },
  monthly: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  committed: { type: Number, default: 0 },
  alerts: {
    at70: { type: Boolean, default: false },
    at90: { type: Boolean, default: false },
    at100: { type: Boolean, default: false }
  }
}
```

### **Paso 2: Hooks en Requisition para actualizar presupuesto**

**Archivo:** `backend/src/models/Requisition.ts` (MODIFICAR)

```typescript
// Pre-save: Actualizar "committed" cuando se crea
RequisitionSchema.pre('save', async function(next) {
  if (this.isNew) {
    await Department.findByIdAndUpdate(
      this.department,
      { $inc: { 'budget.committed': this.totalAmount } }
    );
  }
  next();
});

// Post-approval: Mover de "committed" a "spent"
RequisitionSchema.post('save', async function(doc) {
  if (doc.status === 'approved') {
    await Department.findByIdAndUpdate(
      doc.department,
      {
        $inc: {
          'budget.committed': -doc.totalAmount,
          'budget.spent': doc.totalAmount
        }
      }
    );
  }
});
```

### **Paso 3: Crear endpoints de presupuesto**

```typescript
// GET /api/departments/:id/budget
// PUT /api/departments/:id/budget
// POST /api/departments/:id/budget/reset
```

### **Paso 4: UI de presupuestos (Frontend)**

Página con:
- Progress bar animada
- Semáforo (verde/amarillo/rojo)
- Forecast de fin de mes
- Historial de gastos

---

## 📧 Feature 3: Notificaciones

### **Paso 1: Setup NodeMailer**

```bash
cd backend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### **Paso 2: Configurar servicio de email**

**Archivo:** `backend/src/services/EmailService.ts` (CREAR)

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `"NOVUM" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  });
};
```

### **Paso 3: Templates de email**

```typescript
export const requisitionApprovedTemplate = (requisition: any) => `
  <h1>Requisición Aprobada</h1>
  <p>Su requisición ${requisition.requisitionNumber} ha sido aprobada.</p>
  <a href="${process.env.CLIENT_URL}/requisitions/${requisition._id}">Ver detalle</a>
`;
```

### **Paso 4: Modelo de Notificación**

```typescript
// Notification schema con: user, type, title, message, link, read
```

### **Paso 5: Bell icon en frontend**

Componente con badge, dropdown, y lista de notificaciones.

---

## 📄 Feature 4: Exportación PDF/Excel

### **Paso 1: Instalar dependencias**

```bash
cd backend
npm install puppeteer xlsx
npm install --save-dev @types/node
```

### **Paso 2: Servicio de PDF**

```typescript
import puppeteer from 'puppeteer';

export const generateRequisitionPDF = async (requisition: any) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Requisición ${requisition.requisitionNumber}</title></head>
      <body>
        <h1>Requisición ${requisition.requisitionNumber}</h1>
        <!-- HTML template aquí -->
      </body>
    </html>
  `;

  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();

  return pdf;
};
```

### **Paso 3: Endpoint de exportación**

```typescript
router.get('/requisitions/:id/export/pdf', protect, async (req, res) => {
  const requisition = await Requisition.findById(req.params.id).populate('...');
  const pdf = await generateRequisitionPDF(requisition);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${requisition.requisitionNumber}.pdf"`);
  res.send(pdf);
});
```

---

## 🎯 Orden de Implementación Recomendado

### **Semana 1:**
1. Dashboard con gráficos (Feature 1) - 2 días
2. Endpoints de estadísticas - 1 día
3. Testing y ajustes - 1 día

### **Semana 2:**
1. Modelo de presupuestos (Feature 2) - 2 días
2. Hooks y lógica de negocio - 1 día
3. UI de presupuestos - 1 día

### **Semana 3:**
1. Setup de NodeMailer (Feature 3) - 1 día
2. Templates y triggers de email - 1 día
3. Modelo de notificaciones in-app - 1 día
4. UI de notificaciones - 1 día

### **Semana 4:**
1. Servicio de PDF (Feature 4) - 2 días
2. Servicio de Excel - 1 día
3. Testing completo - 1 día

---

## ✅ Checklist de Completitud

Cada feature está completa cuando:

- [ ] Código backend funcionando
- [ ] Código frontend funcionando
- [ ] Tests escritos (al menos básicos)
- [ ] Documentación actualizada
- [ ] Demo funcional preparada
- [ ] Sin bugs críticos

---

## 📞 Ayuda y Recursos

**Documentación:**
- Chart.js: https://www.chartjs.org/docs/latest/
- NodeMailer: https://nodemailer.com/about/
- Puppeteer: https://pptr.dev/
- xlsx: https://www.npmjs.com/package/xlsx

**¿Dudas?**
Consulta los archivos de documentación en la raíz del proyecto.

---

**Última actualización:** Diciembre 11, 2024
**Próxima revisión:** Diciembre 18, 2024
