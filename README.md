# NOVUM - Sistema de Gestión de Requisiciones y Compras

Sistema integral para la gestión de requisiciones, órdenes de compra y recepción de mercancías con flujos de aprobación multinivel.

## Características Principales

- Gestión completa de requisiciones con flujo de aprobación multinivel
- Sistema de autenticación JWT con roles y permisos
- Gestión de órdenes de compra y proveedores
- Recepción de mercancías y control de almacén
- Dashboard con estadísticas en tiempo real
- Sistema de secuencias automáticas
- Rate limiting y seguridad robusta
- Logging estructurado con Winston
- Base de datos MongoDB Atlas optimizada
- Frontend React con TypeScript y Tailwind CSS

## Tecnologías

### Backend
- Node.js + Express
- TypeScript
- MongoDB Atlas + Mongoose
- JWT para autenticación
- Express Validator
- Helmet para seguridad
- Winston para logging
- Rate Limiting

### Frontend
- React 18
- TypeScript
- Vite
- React Router DOM
- TanStack Query (React Query)
- Zustand
- Tailwind CSS
- Axios
- React Hook Form + Zod

## Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta de MongoDB Atlas
- Git

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd NOVUM
```

### 2. Instalar dependencias

```bash
# Instalar todas las dependencias (root, server y client)
npm run install:all
```

### 3. Configurar MongoDB Atlas

1. Crear una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear un nuevo cluster (free tier funciona perfectamente)
3. Crear un usuario de base de datos:
   - Ve a Database Access
   - Add New Database User
   - Crea usuario y contraseña
4. Configurar acceso de red:
   - Ve a Network Access
   - Add IP Address
   - Selecciona "Allow Access from Anywhere" (0.0.0.0/0) para desarrollo
5. Obtener string de conexión:
   - Ve a Database > Connect
   - Choose "Connect your application"
   - Copia el connection string

### 4. Configurar variables de entorno

#### Backend (server/.env)

```bash
cd server
cp .env.example .env
```

Editar `server/.env`:

```env
# MongoDB Atlas - REEMPLAZAR CON TU STRING DE CONEXIÓN
MONGODB_URI=mongodb+srv://tu-usuario:tu-password@cluster.mongodb.net/novum?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=development

# JWT - CAMBIAR EN PRODUCCIÓN
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

#### Frontend (client/.env)

```bash
cd ../client
cp .env.example .env
```

Editar `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Cargar datos de prueba

```bash
# Desde la raíz del proyecto
npm run seed
```

Esto creará:
- 8 departamentos
- 8 usuarios de prueba con diferentes roles
- Categorías jerárquicas
- 3 proveedores
- Configuraciones de aprobación
- Secuencias iniciales

## Usuarios de Prueba

Una vez ejecutado el seed, puedes acceder con estos usuarios:

| Email | Password | Rol |
|-------|----------|-----|
| admin@novum.com | Admin123! | Administrador |
| compras@novum.com | Compras123! | Compras |
| finanzas@novum.com | Finanzas123! | Finanzas |
| aprobador@novum.com | Aprobador123! | Aprobador |
| almacen@novum.com | Almacen123! | Almacén |
| solicitante@novum.com | Solicitante123! | Solicitante |

## Ejecución

### Modo Desarrollo

```bash
# Desde la raíz - Ejecuta servidor y cliente simultáneamente
npm run dev
```

Esto iniciará:
- Backend en http://localhost:5000
- Frontend en http://localhost:5173

### Ejecutar por separado

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

## Producción

### Build

```bash
# Build completo
npm run build

# Build solo backend
npm run build:server

# Build solo frontend
npm run build:client
```

### Desplegar

```bash
# Iniciar servidor en producción
npm start
```

## Estructura del Proyecto

```
NOVUM/
├── server/                 # Backend Express + TypeScript
│   ├── src/
│   │   ├── config/        # Configuración (DB, Logger)
│   │   ├── controllers/   # Controladores
│   │   ├── middleware/    # Middleware (Auth, Error, Validation)
│   │   ├── models/        # Modelos Mongoose
│   │   ├── routes/        # Rutas de la API
│   │   ├── seeds/         # Datos de prueba
│   │   ├── utils/         # Utilidades
│   │   └── app.ts         # Entrada principal
│   ├── logs/              # Archivos de log
│   └── package.json
│
├── client/                # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── context/       # Context API (Auth)
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Páginas/Vistas
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Componente principal
│   │   └── main.tsx       # Entrada
│   └── package.json
│
└── package.json           # Scripts raíz
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/update-password` - Actualizar contraseña
- `POST /api/auth/register` - Registrar usuario (admin)

### Requisiciones
- `GET /api/requisitions` - Listar requisiciones
- `POST /api/requisitions` - Crear requisición
- `GET /api/requisitions/:id` - Detalle de requisición
- `POST /api/requisitions/:id/approve` - Aprobar requisición
- `POST /api/requisitions/:id/reject` - Rechazar requisición
- `POST /api/requisitions/:id/cancel` - Cancelar requisición

## Roles y Permisos

### Admin
- Acceso total al sistema
- Gestión de usuarios
- Configuración de aprobaciones
- Vista de todas las requisiciones

### Requester (Solicitante)
- Crear requisiciones
- Ver sus requisiciones
- Cancelar requisiciones propias

### Approver (Aprobador)
- Aprobar/rechazar requisiciones de su departamento
- Ver requisiciones pendientes de aprobación
- Límite de aprobación configurable

### Finance (Finanzas)
- Aprobar requisiciones de alto monto
- Segundo nivel de aprobación
- Vista de todas las requisiciones

### Purchasing (Compras)
- Crear órdenes de compra
- Gestionar proveedores
- Ver todas las requisiciones aprobadas

### Warehouse (Almacén)
- Registrar recepción de mercancías
- Gestionar inventario

## Flujo de Aprobación

El sistema implementa un flujo de aprobación multinivel basado en montos:

1. **Hasta $10,000**
   - Nivel 1: Jefe de Departamento

2. **$10,001 - $50,000**
   - Nivel 1: Jefe de Departamento
   - Nivel 2: Gerente de Finanzas

3. **Mayor a $50,000**
   - Nivel 1: Jefe de Departamento
   - Nivel 2: Gerente de Finanzas
   - Nivel 3: Director General

## Seguridad

- Autenticación JWT con tokens de 7 días
- Contraseñas hasheadas con bcrypt (12 rounds)
- Rate limiting por endpoint
- Validación de datos con express-validator
- Helmet para headers de seguridad
- CORS configurado
- Sanitización de inputs
- Logging de accesos y errores

## Índices de MongoDB

El sistema utiliza índices optimizados para MongoDB Atlas:

### Requisitions
- `requisitionNumber` (único)
- `status + department`
- `requester + status + requestDate`
- `status + priority + requestDate`
- Índice de texto en `title`, `description`, `items.description`

### Users
- `email` (único)
- `employeeCode` (único)
- `role + isActive`
- `department + role`

### PurchaseOrders
- `orderNumber` (único)
- `supplier + status + orderDate`
- `status + department`

## Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor + Cliente
npm run dev:server       # Solo servidor
npm run dev:client       # Solo cliente

# Build
npm run build            # Build completo
npm run build:server     # Build servidor
npm run build:client     # Build cliente

# Producción
npm start               # Iniciar servidor

# Base de datos
npm run seed            # Cargar datos de prueba
npm run seed:reset      # Limpiar base de datos

# Testing y Calidad
npm run test            # Tests
npm run lint            # Linting

# Instalación
npm run install:all     # Instalar todas las dependencias
```

## Solución de Problemas

### Error de conexión a MongoDB

1. Verificar que el string de conexión sea correcto
2. Verificar que la IP esté en la whitelist de MongoDB Atlas
3. Verificar que el usuario de DB tenga permisos

### Puerto ocupado

Si el puerto 5000 o 5173 está ocupado:

```bash
# Cambiar en server/.env
PORT=3000

# Cambiar en client/.env
VITE_API_URL=http://localhost:3000/api
```

### Error al instalar dependencias

```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json
rm -rf client/node_modules client/package-lock.json

npm run install:all
```

## Mejoras Futuras

- [ ] Módulo de Órdenes de Compra completo
- [ ] Integración con proveedores (API)
- [ ] Reportes y analíticas avanzadas
- [ ] Notificaciones por email
- [ ] Exportación a PDF de requisiciones
- [ ] Gestión de presupuestos departamentales
- [ ] Dashboard de métricas en tiempo real
- [ ] App móvil con React Native
- [ ] Integración con sistemas ERP
- [ ] Firma digital de aprobaciones

## Contribuir

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Soporte

Para soporte y preguntas:
- Abrir un issue en GitHub
- Email: soporte@novum.com

## Autores

- Equipo NOVUM

---

Desarrollado con ❤️ usando TypeScript, React y MongoDB Atlas
