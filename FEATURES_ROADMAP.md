# 🗺️ Features Roadmap - NOVUM

## Sistema de Gestión de Requisiciones Enterprise

---

## 📅 Roadmap General

### **✅ Completado (v1.0 - Actual)**

#### Core Features
- ✅ Autenticación JWT con roles (admin, approver, purchasing, finance, warehouse, requester)
- ✅ Sistema de aprobación multinivel basado en montos
- ✅ Gestión de requisiciones (CRUD completo)
- ✅ Gestión de órdenes de compra (CRUD básico)
- ✅ Dashboard básico con estadísticas
- ✅ Gestión de proveedores
- ✅ Gestión de departamentos
- ✅ Gestión de categorías
- ✅ Sistema de secuencias automáticas (REQ-0001, PO-0001)
- ✅ Búsqueda por texto en requisiciones
- ✅ Filtros básicos (estado, departamento, prioridad)
- ✅ Historial de aprobaciones
- ✅ Modelos de GoodsReceipt (recepción de mercancías)

#### Seguridad
- ✅ Rate limiting global
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado dinámicamente
- ✅ Validación de inputs (express-validator)
- ✅ Contraseñas hasheadas (bcrypt)
- ✅ Logging estructurado (Winston)

#### Base de Datos
- ✅ MongoDB Atlas con índices optimizados
- ✅ Índices compuestos para queries frecuentes
- ✅ Full-text search en requisiciones
- ✅ Población de relaciones (populate)

---

## 🚀 En Desarrollo (v1.1 - Mes 1)

### **Prioridad Crítica 🔴**

#### 1. Dashboard de Analíticas Avanzado
**Responsable:** Frontend Team
**Estado:** 🟡 En Progreso
**Deadline:** Semana 2

**Features:**
- [ ] Integrar Chart.js o Recharts
- [ ] Gráfico de tendencia de gastos (últimos 6 meses)
- [ ] Gráfico de barras: Top 5 proveedores
- [ ] Gráfico de línea: Tiempo promedio de aprobación
- [ ] Pie chart: Distribución por departamento
- [ ] Pie chart: Distribución por categoría
- [ ] Cards con KPIs animados:
  - [ ] Ahorro vs presupuesto (%)
  - [ ] Tasa de aprobación (%)
  - [ ] Valor total órdenes activas
  - [ ] Órdenes pendientes de recepción
- [ ] Sistema de alertas visuales:
  - [ ] Badge de requisiciones urgentes
  - [ ] Badge de órdenes vencidas
  - [ ] Badge de presupuestos al 80%+

**Archivos a modificar:**
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/charts/` (nuevo)
- `backend/src/controllers/dashboardController.ts` (nuevo)
- `backend/src/routes/dashboardRoutes.ts` (nuevo)

---

#### 2. Gestión de Presupuestos Departamentales
**Responsable:** Full-stack Team
**Estado:** ⚪ Pendiente
**Deadline:** Semana 3

**Features Backend:**
- [ ] Extender modelo Department con campos:
  - [ ] `budget.annual: number`
  - [ ] `budget.monthly: number`
  - [ ] `budget.spent: number`
  - [ ] `budget.committed: number`
  - [ ] `budget.alerts: { at70: boolean, at90: boolean, at100: boolean }`
- [ ] Endpoint: `GET /api/departments/:id/budget`
- [ ] Endpoint: `PUT /api/departments/:id/budget`
- [ ] Endpoint: `GET /api/departments/:id/budget/report`
- [ ] Hook pre-save en Requisition para actualizar `committed`
- [ ] Hook post-approval para mover de `committed` a `spent`
- [ ] Cron job para reset mensual de presupuestos
- [ ] Sistema de alertas cuando se alcanza 70%, 90%, 100%
- [ ] Bloqueo de requisiciones si se supera presupuesto (configurable)

**Features Frontend:**
- [ ] Página: `BudgetManagement.tsx`
- [ ] Componente: `BudgetProgressBar.tsx`
- [ ] Componente: `BudgetAlerts.tsx`
- [ ] Modal: Configurar presupuesto departamental
- [ ] Dashboard con visualización:
  - [ ] Barra de progreso animada
  - [ ] Semáforo (verde/amarillo/rojo)
  - [ ] Forecast de fin de mes/año

**Archivos a crear:**
- `backend/src/controllers/budgetController.ts`
- `backend/src/routes/budgetRoutes.ts`
- `backend/src/jobs/budgetReset.cron.ts`
- `frontend/src/pages/BudgetManagement.tsx`
- `frontend/src/components/budget/` (varios)

---

#### 3. Sistema de Notificaciones Email + In-App
**Responsable:** Backend + Frontend Team
**Estado:** ⚪ Pendiente
**Deadline:** Semana 4

**Features Backend:**
- [ ] Setup NodeMailer o SendGrid
- [ ] Modelo: `Notification` con campos:
  - [ ] `user: ObjectId`
  - [ ] `type: 'requisition_pending' | 'requisition_approved' | etc`
  - [ ] `title: string`
  - [ ] `message: string`
  - [ ] `link: string`
  - [ ] `read: boolean`
  - [ ] `createdAt: Date`
- [ ] Service: `NotificationService.ts`:
  - [ ] `sendEmail(to, subject, html)`
  - [ ] `createInAppNotification(userId, data)`
  - [ ] `markAsRead(notificationId)`
- [ ] Endpoints:
  - [ ] `GET /api/notifications` (mis notificaciones)
  - [ ] `PUT /api/notifications/:id/read`
  - [ ] `DELETE /api/notifications/:id`
  - [ ] `GET /api/notifications/unread-count`
- [ ] Triggers de emails:
  - [ ] Nueva requisición → notificar aprobador
  - [ ] Requisición aprobada → notificar requester
  - [ ] Requisición rechazada → notificar requester
  - [ ] Orden de compra creada → notificar compras
  - [ ] Orden enviada → notificar proveedor
  - [ ] Reminder: requisición >3 días sin aprobar
- [ ] Template engine para emails (Handlebars)
- [ ] Templates HTML profesionales

**Features Frontend:**
- [ ] Bell icon en navbar con badge
- [ ] Dropdown de notificaciones
- [ ] Página: `NotificationsPage.tsx`
- [ ] Componente: `NotificationItem.tsx`
- [ ] Polling o WebSocket para actualizaciones real-time
- [ ] Sonido al recibir notificación (opcional)
- [ ] Página de preferencias: `NotificationSettings.tsx`

**Archivos a crear:**
- `backend/src/models/Notification.ts`
- `backend/src/services/NotificationService.ts`
- `backend/src/services/EmailService.ts`
- `backend/src/templates/emails/` (varios .hbs)
- `backend/src/controllers/notificationController.ts`
- `backend/src/routes/notificationRoutes.ts`
- `frontend/src/components/NotificationBell.tsx`
- `frontend/src/pages/NotificationsPage.tsx`

---

#### 4. Exportación a PDF y Excel
**Responsable:** Backend Team
**Estado:** ⚪ Pendiente
**Deadline:** Semana 4

**Features:**
- [ ] Exportar Requisición a PDF:
  - [ ] Puppeteer o PDFKit
  - [ ] Template profesional con logo
  - [ ] Incluir historial de aprobaciones
  - [ ] Incluir items detallados
  - [ ] Firmas digitales (simuladas con timestamps)
- [ ] Exportar Orden de Compra a PDF:
  - [ ] Formato oficial para enviar a proveedores
  - [ ] Términos y condiciones
  - [ ] Información fiscal
- [ ] Exportar lista de requisiciones a Excel:
  - [ ] Library: xlsx o exceljs
  - [ ] Aplicar filtros antes de exportar
  - [ ] Múltiples hojas (resumen, detalle)
- [ ] Exportar reportes a Excel:
  - [ ] Gasto por proveedor
  - [ ] Gasto por período
  - [ ] Análisis ABC

**Endpoints:**
- [ ] `GET /api/requisitions/:id/export/pdf`
- [ ] `GET /api/purchase-orders/:id/export/pdf`
- [ ] `GET /api/requisitions/export/excel?filters=...`
- [ ] `GET /api/reports/:reportType/export/excel`

**Archivos a crear:**
- `backend/src/services/PdfService.ts`
- `backend/src/services/ExcelService.ts`
- `backend/src/templates/pdf/requisition.hbs`
- `backend/src/templates/pdf/purchase-order.hbs`
- `backend/src/controllers/exportController.ts`
- `backend/src/routes/exportRoutes.ts`

---

## 🔜 Próximo Sprint (v1.2 - Mes 2)

### **Prioridad Alta 🟡**

#### 5. Búsqueda y Filtros Avanzados
**Deadline:** Semana 6

**Features:**
- [ ] Filtros combinados en UI:
  - [ ] Date range picker (desde-hasta)
  - [ ] Range slider para montos
  - [ ] Multi-select para estados
  - [ ] Multi-select para departamentos
  - [ ] Checkbox para prioridad
- [ ] Backend: Query builder flexible
- [ ] Autocompletar en búsqueda
- [ ] Búsqueda por número exacto (REQ-0042)
- [ ] Historial de búsquedas (localStorage)
- [ ] Vistas guardadas:
  - [ ] CRUD de vistas personalizadas
  - [ ] Compartir vistas con equipo

---

#### 6. Reportes Personalizables
**Deadline:** Semana 7

**Reportes Predefinidos:**
1. [ ] Gasto por proveedor (Top 10)
2. [ ] Lead time de aprobación por departamento
3. [ ] Compliance: % de requisiciones con 3+ cotizaciones
4. [ ] Análisis ABC de productos
5. [ ] Comparativa mes a mes (este año vs anterior)

**Features:**
- [ ] Página: `ReportsPage.tsx`
- [ ] Selector de reporte
- [ ] Filtros por fecha
- [ ] Visualización con gráficos
- [ ] Exportar a PDF/Excel
- [ ] Scheduled reports (email automático semanal)

---

#### 7. PWA (Progressive Web App)
**Deadline:** Semana 8

**Features:**
- [ ] Service Worker
- [ ] Manifest.json
- [ ] Install prompt
- [ ] Offline fallback
- [ ] Push notifications (Web Push API)
- [ ] Cacheo inteligente de assets
- [ ] Interfaz mobile-first:
  - [ ] Sidebar colapsable
  - [ ] Touch-friendly buttons
  - [ ] Swipe actions
- [ ] Aprobar/rechazar offline con sync

---

#### 8. Internacionalización (i18n)
**Deadline:** Semana 8

**Features:**
- [ ] i18next para frontend
- [ ] i18n para backend (emails, PDFs)
- [ ] Idiomas soportados:
  - [ ] Español (default)
  - [ ] Inglés
- [ ] Selector de idioma en settings
- [ ] Traducir todos los strings
- [ ] Localización de fechas (date-fns)
- [ ] Localización de números/moneda

---

## 🎯 Futuro Cercano (v2.0 - Mes 3)

### **Prioridad Media 🟢**

#### 9. Workflow Builder Visual
**Deadline:** Semana 12

**Features:**
- [ ] Editor drag & drop (React Flow)
- [ ] Bloques:
  - [ ] Start/End
  - [ ] Aprobador
  - [ ] Condicional (if/else)
  - [ ] Aprobación paralela
  - [ ] Notificación
  - [ ] Delay/Timer
- [ ] Reglas condicionales avanzadas:
  - [ ] Monto > X AND categoría = Y
  - [ ] Departamento = Z OR prioridad = urgente
- [ ] Delegación automática si no responde en X horas
- [ ] Test mode (simular flujo)
- [ ] Versionado de workflows

---

#### 10. API Pública Documentada
**Deadline:** Semana 10

**Features:**
- [ ] OpenAPI 3.0 spec
- [ ] Swagger UI en `/api-docs`
- [ ] API Keys para autenticación
- [ ] Rate limiting por API key
- [ ] Webhooks:
  - [ ] `requisition.created`
  - [ ] `requisition.approved`
  - [ ] `purchase_order.sent`
- [ ] SDK en JavaScript/TypeScript
- [ ] Ejemplos de código
- [ ] Postman collection

---

#### 11. Supplier Portal (MVP)
**Deadline:** Semana 11

**Features:**
- [ ] Login separado para proveedores
- [ ] Dashboard de proveedor:
  - [ ] Órdenes activas
  - [ ] Historial de órdenes
  - [ ] Facturas pendientes
- [ ] Ver detalle de orden de compra
- [ ] Confirmar recepción de orden
- [ ] Actualizar estado de preparación
- [ ] Subir factura/albarán
- [ ] Chat con compras

---

## 🔮 Futuro Lejano (v3.0+ - Mes 4-12)

### **Prioridad Baja ⚪**

#### 12. Módulo de Inventario
- [ ] Gestión de stock
- [ ] Ubicaciones de almacén
- [ ] Movimientos de inventario
- [ ] Stock mínimo/máximo
- [ ] Alertas de reorden
- [ ] Integración con GoodsReceipt

---

#### 13. Módulo de Contratos
- [ ] Contratos con proveedores
- [ ] Términos y condiciones
- [ ] Fecha de vencimiento
- [ ] Alertas de renovación
- [ ] Anexos y documentos
- [ ] Firma digital

---

#### 14. Integración con ERPs
- [ ] SAP Business One
- [ ] QuickBooks Online
- [ ] Odoo
- [ ] Dynamics 365
- [ ] Contpaqi (México)
- [ ] Sincronización bidireccional
- [ ] Mapping de campos configurables

---

#### 15. AI y Machine Learning
- [ ] Auto-categorización de items (NLP)
- [ ] Predicción de presupuesto (Time Series)
- [ ] Recomendación de proveedores (Collaborative Filtering)
- [ ] Detección de duplicados (Similarity)
- [ ] Detección de fraude (Anomaly Detection)
- [ ] Optimización de precios (Price Intelligence)

---

#### 16. Multi-Tenant SaaS
- [ ] Arquitectura multi-tenant
- [ ] Aislamiento de datos por tenant
- [ ] Subdominios personalizados
- [ ] Configuración por tenant
- [ ] Facturación automatizada
- [ ] Trial automático de 14 días

---

#### 17. Mobile App (React Native)
- [ ] App nativa iOS/Android
- [ ] Sincronización offline
- [ ] Escaneo de códigos de barras
- [ ] Firma digital táctil
- [ ] Push notifications nativas
- [ ] Cámara para fotos de cotizaciones

---

## 📊 Métricas de Éxito por Feature

### **Dashboard Analíticas:**
- ✅ Tiempo en página >2 min (vs 30 seg actual)
- ✅ 80% de usuarios lo visitan diariamente
- ✅ Reducción de 50% en consultas "¿Cómo vamos?"

### **Presupuestos:**
- ✅ 100% de departamentos con presupuesto configurado
- ✅ Reducción de 30% en sobregiros presupuestarios
- ✅ 90% de accuracy en forecast

### **Notificaciones:**
- ✅ 60% de open rate en emails
- ✅ 80% de in-app notifications leídas
- ✅ Reducción de 50% en tiempo de aprobación

### **Exportación PDF:**
- ✅ 70% de requisiciones exportadas antes de aprobar
- ✅ 100% de órdenes exportadas para envío

---

## 🛠️ Tech Debt a Resolver

### **Alta Prioridad:**
- [ ] Agregar suite de testing (Jest + Supertest + React Testing Library)
- [ ] Implementar refresh tokens para JWT
- [ ] Sanitización contra MongoDB injection (mongo-sanitize)
- [ ] Mejorar error handling (consistencia en throw vs return)
- [ ] Agregar validación granular de permisos en aprobaciones

### **Media Prioridad:**
- [ ] Implementar soft delete en modelos importantes
- [ ] Agregar audit trail completo (modelo AuditLog)
- [ ] Optimizar queries con DataLoader (evitar N+1)
- [ ] Comprimir y rotar logs (winston-daily-rotate-file)
- [ ] Migrar tokens a httpOnly cookies (XSS protection)

### **Baja Prioridad:**
- [ ] Documentación interna (JSDoc)
- [ ] Swagger para API actual
- [ ] Monitoreo con Sentry/Datadog
- [ ] CI/CD con GitHub Actions
- [ ] Docker compose para dev environment

---

## 📞 Equipo y Responsables

**Backend Team:**
- Lead: TBD
- Developers: 2

**Frontend Team:**
- Lead: TBD
- Developers: 2

**Product:**
- PM: TBD
- UX Designer: TBD

**DevOps:**
- Engineer: TBD (part-time)

---

**Última actualización:** Diciembre 10, 2024
**Próxima revisión:** Diciembre 17, 2024
