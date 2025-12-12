# 🚀 NOVUM - Sistema de Gestión de Requisiciones y Compras

Sistema integral enterprise para la gestión del ciclo de vida de compras: desde la requisición de materiales por parte de los empleados, pasando por flujos de aprobación multinivel, hasta la generación de órdenes de compra y la recepción de mercancías en almacén.

> **Versión:** 1.0.0
> **Estado:** ✅ Producción (Fase 1 Completa)
> **Última actualización:** Diciembre 12, 2024

---

## 📚 Documentación Adicional

- 📊 [**Plan de Comercialización**](PLAN_COMERCIALIZACION.md) - Estrategia de negocio, pricing, roadmap comercial
- 🗺️ [**Features Roadmap**](FEATURES_ROADMAP.md) - Roadmap detallado de funcionalidades
- 🔧 [**Mejoras Técnicas**](MEJORAS_TECNICAS.md) - Deuda técnica y mejoras de seguridad

---

## 🌟 Visión General del Sistema

NOVUM centraliza y automatiza el proceso de abastecimiento de la empresa. Su objetivo es eliminar el papeleo, acelerar las aprobaciones, mantener un control estricto del presupuesto y asegurar que lo que se pide es lo que llega.

### Ciclo de Vida Principal
1. **Requisición**: Un empleado solicita materiales o servicios.
2. **Aprobación**: Según el departamento y el monto, la solicitud pasa por 1 a 3 niveles de aprobación (Jefe Directo -> Finanzas -> Dirección).
3. **Compra**: El departamento de Compras cotiza y genera la Orden de Compra (PO) seleccionando al mejor proveedor.
4. **Recepción**: Almacén recibe la mercancía física y valida contra la PO.
5. **Inventario**: El stock se actualiza automáticamente.

---

## 🔑 Roles y Permisos Detallados

El sistema utiliza un control de acceso basado en roles (RBAC) estricto. A continuación se detalla qué puede hacer cada perfil:

### 👑 Admin (Administrador)
*El "Superusuario" del sistema.*
- **Gestión Total**: Acceso completo a todos los módulos.
- **Configuración**: Crea Usuarios, Departamentos y define Jerarquías.
- **Catálogos**: Puede Crear, Editar y Eliminar Productos, Proveedores y Categorías.
- **Auditoría**: Puede ver todos los movimientos y logs del sistema.
- *Uso típico: Gerente de TI o Administrador del Sistema.*

### 🛒 Purchasing (Compras)
*Encargado de negociar y adquirir bienes.*
- **Gestión de Catálogos**: Puede crear y actualizar Productos, Proveedores y Categorías.
- **Órdenes de Compra**: Transforma requisiciones aprobadas en Órdenes de Compra.
- **Proveedores**: Gestiona la relación, precios y datos de los proveedores.
- **Visibilidad Global**: Puede ver el estado de todas las requisiciones aprobadas pendientes de compra.
- *Uso típico: Analistas de Compras, Gerente de Compras.*

### 📦 Warehouse (Almacén)
*Guardianes del inventario físico.*
- **Recepción**: Registra la entrada de mercancía al llegar a la bodega.
- **Gestión de Stock**: Puede realizar ajustes de inventario (entradas/salidas manuales).
- **Consulta**: Revisa qué órdenes de compra están próximas a llegar.
- **Catálogos**: Puede ver el listado de productos y sus ubicaciones, pero no crear nuevos (típicamente).
- *Uso típico: Jefe de Almacén, Auxiliares de Bodega.*

### ✅ Approver (Aprobador)
*Responsable de autorizar gastos.*
- **Bandeja de Entrada**: Recibe notificaciones de requisiciones de su equipo.
- **Decisión**: Puede **Aprobar** (pasa al siguiente nivel o a compras) o **Rechazar** (devuelve al solicitante con comentarios).
- **Historial**: Puede ver el historial de aprobaciones de su departamento.
- *Uso típico: Jefes de Departamento, Gerentes de Área.*

### 💰 Finance (Finanzas)
*Control presupuestal.*
- **Aprobación de Alto Nivel**: Interviene automáticamente en compras que superan cierto monto (ej. > $10,000 MXN).
- **Visibilidad**: Puede consultar reportes de gastos por departamento.
- *Uso típico: Contralor, Gerente Financiero.*

### 👤 Requester (Solicitante)
*El usuario final estándar.*
- **Solicitar**: Crea nuevas requisiciones seleccionando productos del catálogo.
- **Seguimiento**: Puede ver en qué etapa está su solicitud (Pendiente, Aprobada, Comprada, Recibida).
- **Gestión Propia**: Puede cancelar sus propias solicitudes si aún no han sido procesadas.
- *Uso típico: Cualquier empleado operativo o administrativo.*

---

## 🛠️ Tecnologías

### Backend
- **Node.js + Express**: Servidor robusto y escalable.
- **MongoDB Atlas**: Base de datos NoSQL para manejar datos flexibles como atributos variables de productos.
- **JWT**: Seguridad en sesiones stateless.

### Frontend
- **React 18 + TypeScript**: Interfaz moderna, tipada y segura.
- **Tailwind CSS**: Diseño responsivo y limpio.
- **TanStack Query**: Manejo eficiente del estado del servidor y caché.

---

## 🚀 Instalación y Despliegue

### Requisitos
- Node.js >= 18.0.0
- MongoDB Connection String

### Pasos Rápidos

1. **Clonar y Preparar**
   ```bash
   git clone <repo>
   cd NOVUM
   npm run install:all
   ```

2. **Configurar Entorno**
   - Copiar `.env.example` a `.env` en carpetas `backend` y `frontend`.
   - Llenar `MONGODB_URI` en `backend/.env`.

3. **Datos Iniciales (Seed)**
   ```bash
   npm run seed
   ```
   *Esto creará los usuarios administrador, catálogos base y configuración inicial.*

4. **Ejecutar**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

---

## 📂 Estructura del Proyecto

```
NOVUM/
├── backend/               # Lógica de negocio y API
│   ├── src/controllers/   # Qué hace el sistema (User, Product, Requisition)
│   ├── src/models/        # Cómo son los datos (Mongoose schemas)
│   └── src/routes/        # Rutas de la API (Endpoints seguros)
│
├── frontend/              # Interfaz de Usuario
│   ├── src/pages/         # Vistas principales (Dashboard, Listados)
│   ├── src/services/      # Conexión con el Backend (Axios)
│   └── src/context/       # Estado global (AuthUser)
```

## 📞 Soporte

Para dudas sobre el funcionamiento o reporte de bugs, contactar al equipo de TI o abrir un issue en el repositorio.
