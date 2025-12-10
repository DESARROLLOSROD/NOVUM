# 🔧 Mejoras Técnicas y Seguridad - NOVUM

## Documento de Deuda Técnica y Mejoras de Seguridad

---

## 🔴 CRÍTICO - Implementar ASAP

### 1. **Testing Suite Completo**
**Problema:** Proyecto sin tests, alto riesgo de bugs en producción
**Prioridad:** 🔴🔴🔴🔴🔴

#### Backend Testing
**Instalar:**
```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

**Configurar:** `backend/jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

**Tests a crear:**
- [ ] `__tests__/unit/models/User.test.ts`
- [ ] `__tests__/unit/models/Requisition.test.ts`
- [ ] `__tests__/integration/auth.test.ts`
- [ ] `__tests__/integration/requisitions.test.ts`
- [ ] `__tests__/integration/approvals.test.ts`
- [ ] `__tests__/e2e/requisition-flow.test.ts`

#### Frontend Testing
**Instalar:**
```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Tests a crear:**
- [ ] `src/__tests__/components/Dashboard.test.tsx`
- [ ] `src/__tests__/pages/Login.test.tsx`
- [ ] `src/__tests__/pages/RequisitionList.test.tsx`
- [ ] `src/__tests__/hooks/useAuth.test.ts`

**Impacto:** ⭐⭐⭐⭐⭐ (Crítico para producción)

---

### 2. **JWT Refresh Tokens**
**Problema:** Tokens expiran en 7 días sin renovación, usuarios se desloguean abruptamente
**Prioridad:** 🔴🔴🔴🔴

**Implementación:**

#### Backend Changes

**Modelo:** `backend/src/models/RefreshToken.ts`
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdByIp: string;
  revokedAt?: Date;
  revokedByIp?: string;
  replacedByToken?: string;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdByIp: { type: String, required: true },
  revokedAt: { type: Date },
  revokedByIp: { type: String },
  replacedByToken: { type: String },
}, { timestamps: true });

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
```

**Actualizar:** `backend/src/middleware/auth.ts`
```typescript
export const generateTokens = (userId: string): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: '15m' // 15 minutos
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '30d' // 30 días
  });

  return { accessToken, refreshToken };
};
```

**Endpoint:** `POST /api/auth/refresh`
```typescript
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token requerido', 401);
  }

  // Verificar refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string };

  // Verificar que el token existe en DB y no está revocado
  const storedToken = await RefreshToken.findOne({
    token: refreshToken,
    userId: decoded.id,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });

  if (!storedToken) {
    throw new AppError('Refresh token inválido o expirado', 401);
  }

  // Generar nuevos tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

  // Revocar token viejo
  storedToken.revokedAt = new Date();
  storedToken.revokedByIp = req.ip;
  storedToken.replacedByToken = newRefreshToken;
  await storedToken.save();

  // Guardar nuevo refresh token
  await RefreshToken.create({
    userId: decoded.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdByIp: req.ip
  });

  res.json({
    success: true,
    data: { accessToken, refreshToken: newRefreshToken }
  });
};
```

#### Frontend Changes

**Interceptor:** `frontend/src/services/api.ts`
```typescript
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No hay refresh token, redirigir a login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

        processQueue(null, accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

**Impacto:** ⭐⭐⭐⭐⭐ (Mejora UX crítica)

---

### 3. **MongoDB Injection Protection**
**Problema:** No hay sanitización explícita de queries
**Prioridad:** 🔴🔴🔴🔴🔴

**Instalar:**
```bash
cd backend
npm install express-mongo-sanitize
```

**Implementar:** `backend/src/app.ts`
```typescript
import mongoSanitize from 'express-mongo-sanitize';

// Después de body parser
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`MongoDB injection attempt detected: ${key} from IP: ${req.ip}`);
  },
}));
```

**Impacto:** ⭐⭐⭐⭐⭐ (Seguridad crítica)

---

### 4. **Error Handling Consistente**
**Problema:** Mezcla de `throw` y `res.status().json()` en controllers
**Prioridad:** 🔴🔴🔴

**Refactor:** Siempre usar `throw AppError` y dejar que el middleware maneje

**Antes:**
```typescript
if (!errors.isEmpty()) {
  res.status(400).json({
    success: false,
    errors: errors.array(),
  });
  return;
}
```

**Después:**
```typescript
if (!errors.isEmpty()) {
  throw new AppError('Errores de validación', 400, errors.array());
}
```

**Actualizar:** `backend/src/middleware/errorHandler.ts`
```typescript
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
    });
  }
};
```

**Impacto:** ⭐⭐⭐⭐ (Mantenibilidad)

---

## 🟡 IMPORTANTE - Implementar en 2 semanas

### 5. **Validación Granular de Permisos en Aprobaciones**
**Problema:** Solo valida rol, no límite de aprobación ni departamento
**Prioridad:** 🟡🟡🟡🟡

**Actualizar:** `backend/src/controllers/requisitionController.ts`
```typescript
// En approveRequisition, línea ~227
const requiredLevel = approvalConfig.levels[requisition.currentApprovalLevel];
if (user.role !== requiredLevel.role) {
  throw new AppError('No tiene permisos para aprobar en este nivel', 403);
}

// AGREGAR: Validar límite de aprobación
if (user.approvalLimit && requisition.totalAmount > user.approvalLimit) {
  throw new AppError(
    `Esta requisición excede su límite de aprobación ($${user.approvalLimit.toLocaleString()})`,
    403
  );
}

// AGREGAR: Validar departamento (excepto roles globales)
if (!['admin', 'finance'].includes(user.role)) {
  if (user.department?.toString() !== requisition.department.toString()) {
    throw new AppError('No puede aprobar requisiciones de otro departamento', 403);
  }
}

// AGREGAR: No permitir auto-aprobación
if (requisition.requester.toString() === user._id.toString()) {
  throw new AppError('No puede aprobar sus propias requisiciones', 403);
}
```

**Impacto:** ⭐⭐⭐⭐⭐ (Compliance y seguridad)

---

### 6. **Rate Limiting Granular**
**Problema:** Rate limit global de 100 req/15min es demasiado permisivo para login
**Prioridad:** 🟡🟡🟡

**Implementar:** `backend/src/middleware/rateLimiter.ts`
```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones, intente más tarde',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de login, intente en 15 minutos',
});

export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});
```

**Aplicar:** `backend/src/routes/authRoutes.ts`
```typescript
import { authLimiter } from '../middleware/rateLimiter';

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, protect, authorize('admin'), register);
```

**Impacto:** ⭐⭐⭐⭐ (Seguridad anti-bruteforce)

---

### 7. **Token en httpOnly Cookies (XSS Protection)**
**Problema:** Token en localStorage es vulnerable a XSS
**Prioridad:** 🟡🟡🟡🟡

**Backend:** `backend/src/controllers/authController.ts`
```typescript
export const login = async (req: Request, res: Response): Promise<void> => {
  // ... validación existente ...

  const { accessToken, refreshToken } = generateTokens(user._id.toString());

  // Guardar refresh token en DB
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdByIp: req.ip
  });

  // Enviar tokens en httpOnly cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutos
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
  });

  res.json({
    success: true,
    data: { user }, // NO enviar tokens en body
  });
};
```

**Middleware:** `backend/src/middleware/auth.ts`
```typescript
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // Priorizar cookie sobre header (backward compatibility)
  if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // ... resto igual ...
};
```

**Frontend:** Remover toda referencia a `localStorage.getItem('token')`

**Impacto:** ⭐⭐⭐⭐⭐ (Seguridad XSS)

---

### 8. **Environment Variables Validation**
**Problema:** App corre sin validar que existen todas las env vars requeridas
**Prioridad:** 🟡🟡🟡

**Instalar:**
```bash
cd backend
npm install zod
```

**Crear:** `backend/src/config/env.ts`
```typescript
import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener mínimo 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32),
  PORT: z.string().regex(/^\d+$/),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  CLIENT_URL: z.string().url(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),
});

export const validateEnv = (): void => {
  try {
    envSchema.parse(process.env);
    console.log('✓ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error);
    process.exit(1);
  }
};
```

**Usar:** `backend/src/app.ts`
```typescript
import { validateEnv } from './config/env';

dotenv.config();
validateEnv(); // FAIL FAST si faltan variables
```

**Impacto:** ⭐⭐⭐⭐ (Previene errores en producción)

---

## 🟢 MEJORAS - Implementar en 1 mes

### 9. **Audit Trail Completo**
**Prioridad:** 🟢🟢🟢

**Modelo:** `backend/src/models/AuditLog.ts`
```typescript
export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string; // 'create' | 'update' | 'delete' | 'approve' | 'reject'
  entity: string; // 'Requisition' | 'PurchaseOrder' | 'User'
  entityId: mongoose.Types.ObjectId;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

**Middleware:** `backend/src/middleware/auditLogger.ts`
```typescript
export const auditLogger = (action: string, entity: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;

    res.json = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        AuditLog.create({
          userId: req.user.id,
          action,
          entity,
          entityId: req.params.id || data.data?._id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          timestamp: new Date()
        }).catch(err => logger.error('Error logging audit:', err));
      }
      return originalJson.call(this, data);
    };

    next();
  };
};
```

**Usar:**
```typescript
router.post('/', protect, auditLogger('create', 'Requisition'), createRequisition);
router.post('/:id/approve', protect, auditLogger('approve', 'Requisition'), approveRequisition);
```

**Impacto:** ⭐⭐⭐⭐ (Compliance y trazabilidad)

---

### 10. **Soft Delete**
**Prioridad:** 🟢🟢🟢

**Instalar:**
```bash
cd backend
npm install mongoose-delete
```

**Aplicar a modelos:**
```typescript
import mongooseDelete from 'mongoose-delete';

RequisitionSchema.plugin(mongooseDelete, {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: 'all'
});
```

**Uso:**
```typescript
// Soft delete
await Requisition.delete({ _id: id }, req.user.id);

// Restaurar
await Requisition.restore({ _id: id });

// Solo activos (default)
await Requisition.find({ status: 'pending' });

// Incluir eliminados
await Requisition.findWithDeleted({ status: 'pending' });

// Solo eliminados
await Requisition.findDeleted();
```

**Impacto:** ⭐⭐⭐ (Recuperación de datos)

---

### 11. **Log Rotation**
**Prioridad:** 🟢🟢

**Instalar:**
```bash
cd backend
npm install winston-daily-rotate-file
```

**Actualizar:** `backend/src/config/logger.ts`
```typescript
import DailyRotateFile from 'winston-daily-rotate-file';

const transport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d' // Mantener 14 días
});

logger.add(transport);
```

**Impacto:** ⭐⭐⭐ (Gestión de disco)

---

### 12. **Helmet Security Headers Mejorados**
**Prioridad:** 🟢🟢🟢

**Actualizar:** `backend/src/app.ts`
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```

**Impacto:** ⭐⭐⭐⭐ (Seguridad headers)

---

## 📊 Resumen de Prioridades

| # | Mejora | Prioridad | Esfuerzo | Impacto | Deadline |
|---|--------|-----------|----------|---------|----------|
| 1 | Testing Suite | 🔴🔴🔴🔴🔴 | Alto | ⭐⭐⭐⭐⭐ | Semana 2 |
| 2 | JWT Refresh | 🔴🔴🔴🔴 | Medio | ⭐⭐⭐⭐⭐ | Semana 2 |
| 3 | MongoDB Injection | 🔴🔴🔴🔴🔴 | Bajo | ⭐⭐⭐⭐⭐ | Semana 1 |
| 4 | Error Handling | 🔴🔴🔴 | Bajo | ⭐⭐⭐⭐ | Semana 1 |
| 5 | Validación Permisos | 🟡🟡🟡🟡 | Medio | ⭐⭐⭐⭐⭐ | Semana 3 |
| 6 | Rate Limiting | 🟡🟡🟡 | Bajo | ⭐⭐⭐⭐ | Semana 3 |
| 7 | httpOnly Cookies | 🟡🟡🟡🟡 | Medio | ⭐⭐⭐⭐⭐ | Semana 4 |
| 8 | Env Validation | 🟡🟡🟡 | Bajo | ⭐⭐⭐⭐ | Semana 2 |
| 9 | Audit Trail | 🟢🟢🟢 | Alto | ⭐⭐⭐⭐ | Mes 2 |
| 10 | Soft Delete | 🟢🟢🟢 | Medio | ⭐⭐⭐ | Mes 2 |
| 11 | Log Rotation | 🟢🟢 | Bajo | ⭐⭐⭐ | Mes 2 |
| 12 | Helmet Mejorado | 🟢🟢🟢 | Bajo | ⭐⭐⭐⭐ | Semana 4 |

---

## 🎯 Plan de Ejecución (Próximas 4 semanas)

### **Semana 1:**
- [x] Reestructurar proyecto (backend/frontend/mobile)
- [ ] MongoDB injection protection (1 hora)
- [ ] Error handling consistente (2 horas)
- [ ] Env validation con Zod (1 hora)

### **Semana 2:**
- [ ] Testing suite setup (4 horas)
- [ ] Tests unitarios críticos (8 horas)
- [ ] JWT refresh tokens (6 horas)

### **Semana 3:**
- [ ] Validación granular de permisos (4 horas)
- [ ] Rate limiting granular (2 horas)
- [ ] Tests de integración (8 horas)

### **Semana 4:**
- [ ] httpOnly cookies migration (6 horas)
- [ ] Helmet security headers (2 horas)
- [ ] Tests E2E (8 horas)
- [ ] Documentación de seguridad (2 horas)

---

**Última actualización:** Diciembre 10, 2024
**Responsable:** Tech Lead
