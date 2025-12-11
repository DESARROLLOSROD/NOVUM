# 📁 Estructura del Proyecto NOVUM

## Vista General

```
NOVUM/
│
├── 📂 backend/                    # API Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/                # Configuración (database, logger)
│   │   ├── controllers/           # Lógica de negocio
│   │   ├── middleware/            # Auth, validation, error handling
│   │   ├── models/                # Esquemas Mongoose
│   │   ├── routes/                # Definición de rutas API
│   │   ├── seeds/                 # Scripts de datos de prueba
│   │   ├── scripts/               # Utilidades (reset password, etc)
│   │   ├── utils/                 # Funciones helper
│   │   └── app.ts                 # Entry point
│   ├── logs/                      # Winston logs
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                       # Variables de entorno
│
├── 📂 frontend/                   # Cliente Web (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/            # Componentes reutilizables
│   │   ├── context/               # React Context (AuthContext)
│   │   ├── hooks/                 # Custom hooks
│   │   ├── pages/                 # Páginas/Vistas principales
│   │   ├── services/              # Capa de API (axios)
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── utils/                 # Constantes y helpers
│   │   ├── App.tsx                # Componente raíz
│   │   └── main.tsx               # Entry point
│   ├── public/                    # Assets estáticos
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env                       # Variables de entorno
│
├── 📂 mobile/                     # App Móvil (React Native - Planificado)
│   └── README.md                  # Especificaciones y roadmap
│
├── 📂 .claude/                    # Configuración de Claude AI
│
├── 📄 PLAN_COMERCIALIZACION.md    # Estrategia de negocio y pricing
├── 📄 FEATURES_ROADMAP.md         # Roadmap de funcionalidades
├── 📄 MEJORAS_TECNICAS.md         # Deuda técnica y seguridad
├── 📄 ESTRUCTURA_PROYECTO.md      # Este archivo
├── 📄 README.md                   # Documentación principal
│
├── 📄 package.json                # Scripts raíz (monorepo)
├── 📄 .gitignore                  # Git ignore rules
└── 📂 node_modules/               # Dependencias raíz
```

---

## 🎯 Backend (API)

### Tecnologías
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Auth:** JWT (bcrypt)
- **Validation:** express-validator
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Winston

### Estructura de Carpetas

```
backend/src/
├── config/
│   ├── database.ts       # Conexión MongoDB Atlas
│   └── logger.ts         # Configuración Winston
│
├── controllers/
│   ├── authController.ts          # Login, register, me, update-password
│   ├── requisitionController.ts   # CRUD requisiciones + approve/reject
│   └── purchaseOrderController.ts # CRUD órdenes de compra
│
├── middleware/
│   ├── auth.ts              # protect, authorize, generateToken
│   ├── errorHandler.ts      # AppError, errorHandler, notFound
│   ├── rateLimiter.ts       # apiLimiter
│   └── validator.ts         # Validaciones custom
│
├── models/
│   ├── User.ts              # Modelo de usuarios
│   ├── Requisition.ts       # Modelo de requisiciones
│   ├── PurchaseOrder.ts     # Modelo de órdenes de compra
│   ├── Department.ts        # Modelo de departamentos
│   ├── Supplier.ts          # Modelo de proveedores
│   ├── Category.ts          # Modelo de categorías
│   ├── ApprovalConfig.ts    # Configuración de aprobaciones
│   ├── GoodsReceipt.ts      # Modelo de recepción de mercancías
│   └── Sequence.ts          # Generador de secuencias
│
├── routes/
│   ├── authRoutes.ts            # POST /login, GET /me, etc
│   ├── requisitionRoutes.ts     # CRUD + approve/reject
│   └── purchaseOrderRoutes.ts   # CRUD purchase orders
│
├── seeds/
│   ├── index.ts      # Script principal de seeding
│   └── reset.ts      # Script para limpiar DB
│
├── scripts/
│   └── resetPassword.ts   # Reset password de admin
│
├── utils/
│   └── (helpers varios)
│
└── app.ts           # Entry point, configuración de Express
```

### API Endpoints

#### Autenticación (`/api/auth`)
- `POST /login` - Iniciar sesión
- `GET /me` - Usuario actual
- `PUT /update-password` - Cambiar contraseña
- `POST /register` - Registrar usuario (admin only)

#### Requisiciones (`/api/requisitions`)
- `GET /` - Listar (con filtros)
- `POST /` - Crear nueva
- `GET /:id` - Detalle
- `POST /:id/approve` - Aprobar
- `POST /:id/reject` - Rechazar
- `POST /:id/cancel` - Cancelar

#### Órdenes de Compra (`/api/purchase-orders`)
- `GET /` - Listar
- `POST /` - Crear
- `GET /:id` - Detalle
- `PUT /:id` - Actualizar
- `DELETE /:id` - Cancelar
- `POST /:id/approve` - Aprobar
- `POST /:id/send` - Enviar a proveedor

---

## 🎨 Frontend (Web App)

### Tecnologías
- **Framework:** React 18
- **Lenguaje:** TypeScript
- **Build Tool:** Vite
- **Routing:** React Router DOM v6
- **State Management:**
  - Server State: TanStack Query (React Query)
  - Client State: Zustand
  - Auth: Context API
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast
- **Icons:** Lucide React

### Estructura de Carpetas

```
frontend/src/
├── components/          # Componentes reutilizables
│   └── (UI components)
│
├── context/
│   └── AuthContext.tsx  # Auth provider + useAuth hook
│
├── hooks/               # Custom hooks
│   └── (React hooks personalizados)
│
├── pages/               # Páginas principales
│   ├── Login.tsx                   # Página de login
│   ├── Dashboard.tsx               # Dashboard principal
│   ├── RequisitionList.tsx         # Lista de requisiciones
│   ├── RequisitionDetail.tsx       # Detalle de requisición
│   ├── CreateRequisition.tsx       # Crear requisición
│   └── PurchaseOrderList.tsx       # Lista de órdenes de compra
│
├── services/            # API layer
│   ├── api.ts                  # Axios instance + interceptors
│   ├── authService.ts          # login, logout, getMe
│   └── requisitionService.ts   # CRUD requisiciones
│
├── types/               # TypeScript types
│   └── index.ts         # Tipos compartidos
│
├── utils/               # Utilidades
│   └── constants.ts     # Constantes de la app
│
├── App.tsx              # Componente raíz + Router
├── main.tsx             # Entry point
└── index.css            # Tailwind imports
```

### Rutas

- `/login` - Página de login (pública)
- `/` - Dashboard (protegida)
- `/requisitions` - Lista de requisiciones (protegida)
- `/requisitions/new` - Crear requisición (protegida)
- `/requisitions/:id` - Detalle de requisición (protegida)
- `/purchase-orders` - Lista de órdenes (protegida)

---

## 📱 Mobile (Planificado)

- **Framework:** React Native (Expo o CLI)
- **Estado:** Planificado para Q1 2025
- **Ver:** [mobile/README.md](mobile/README.md) para detalles completos

---

## 📚 Documentación

### Archivos de Documentación en Raíz

1. **README.md** (Principal)
   - Instalación y setup
   - Configuración de MongoDB Atlas
   - Variables de entorno
   - Scripts disponibles
   - Usuarios de prueba
   - Troubleshooting

2. **PLAN_COMERCIALIZACION.md**
   - Resumen ejecutivo
   - Roadmap de features (3 meses)
   - Modelo de negocio (Freemium + Tiered)
   - Proyección financiera
   - Estrategia Go-to-Market
   - Análisis de competencia

3. **FEATURES_ROADMAP.md**
   - Features completados (v1.0)
   - En desarrollo (v1.1 - Mes 1)
   - Próximo sprint (v1.2 - Mes 2)
   - Futuro cercano (v2.0 - Mes 3)
   - Futuro lejano (v3.0+)
   - Tech debt a resolver

4. **MEJORAS_TECNICAS.md**
   - Mejoras críticas (testing, JWT refresh, seguridad)
   - Mejoras importantes (validación, rate limiting)
   - Mejoras recomendadas (audit trail, soft delete)
   - Plan de ejecución (4 semanas)

5. **ESTRUCTURA_PROYECTO.md** (Este archivo)
   - Vista general de carpetas
   - Tecnologías por módulo
   - Endpoints API
   - Rutas frontend

---

## 🔧 Scripts de Desarrollo

### Root Package.json

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "npm run dev --prefix backend",
    "dev:frontend": "npm run dev --prefix frontend",

    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "npm run build --prefix backend",
    "build:frontend": "npm run build --prefix frontend",

    "start": "npm start --prefix backend",

    "seed": "npm run seed --prefix backend",
    "seed:reset": "npm run seed:reset --prefix backend",

    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "npm run test --prefix backend",
    "test:frontend": "npm run test --prefix frontend",

    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "npm run lint --prefix backend",
    "lint:frontend": "npm run lint --prefix frontend",

    "install:all": "npm install && npm install --prefix backend && npm install --prefix frontend"
  }
}
```

### Comandos Frecuentes

```bash
# Desarrollo
npm run dev                    # Inicia backend + frontend
npm run dev:backend            # Solo backend (puerto 5000)
npm run dev:frontend           # Solo frontend (puerto 5173)

# Base de datos
npm run seed                   # Cargar datos de prueba
npm run seed:reset             # Limpiar DB

# Testing (cuando esté implementado)
npm run test                   # Todos los tests
npm test:backend               # Tests backend
npm test:frontend              # Tests frontend

# Producción
npm run build                  # Build completo
npm start                      # Iniciar servidor en producción
```

---

## 🔐 Configuración de Entorno

### Backend (.env)

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/novum

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📊 Modelos de Datos

### User
- `email`, `password`, `firstName`, `lastName`
- `employeeCode`, `role`, `department`
- `approvalLimit`, `isActive`

### Requisition
- `requisitionNumber` (auto-generado: REQ-0001)
- `requester`, `department`, `status`, `priority`
- `requestDate`, `requiredDate`
- `title`, `description`, `items[]`
- `totalAmount`, `approvalHistory[]`

### PurchaseOrder
- `orderNumber` (auto-generado: PO-0001)
- `requisitions[]`, `supplier`, `buyer`
- `orderDate`, `expectedDeliveryDate`
- `items[]`, `subtotal`, `taxAmount`, `totalAmount`
- `status`, `approvedBy`, `approvalDate`

### Department
- `name`, `code`, `costCenter`
- `manager`, `isActive`

### Supplier
- `name`, `code`, `taxId`
- `contactName`, `email`, `phone`
- `address`, `category`, `rating`

---

## 🚀 Próximos Pasos

### Implementaciones Prioritarias (Próximas 4 semanas)

1. **Semana 1:**
   - ✅ Reestructuración completada
   - [ ] Dashboard con gráficos (Chart.js)
   - [ ] Modelo de presupuestos

2. **Semana 2:**
   - [ ] Sistema de notificaciones (backend)
   - [ ] Notificaciones email (NodeMailer)
   - [ ] Bell icon con notificaciones in-app

3. **Semana 3:**
   - [ ] Exportación a PDF (Puppeteer)
   - [ ] Exportación a Excel (xlsx)
   - [ ] Testing suite setup

4. **Semana 4:**
   - [ ] Búsqueda y filtros avanzados
   - [ ] PWA setup básico
   - [ ] i18n (ES/EN)

---

## 📞 Información de Contacto

**Proyecto:** NOVUM - Procurement Management System
**Versión:** 1.0.0
**Última actualización:** Diciembre 11, 2024

**Para más información:**
- README principal: [README.md](README.md)
- Plan comercial: [PLAN_COMERCIALIZACION.md](PLAN_COMERCIALIZACION.md)
- Roadmap: [FEATURES_ROADMAP.md](FEATURES_ROADMAP.md)
- Mejoras técnicas: [MEJORAS_TECNICAS.md](MEJORAS_TECNICAS.md)
