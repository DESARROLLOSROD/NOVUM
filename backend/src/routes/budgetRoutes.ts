import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getDepartmentBudget,
  updateDepartmentBudget,
  getBudgetsSummary,
} from '../controllers/budgetController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

// GET /api/budgets/summary - Resumen de todos los presupuestos
router.get('/summary', getBudgetsSummary);

// GET /api/departments/:id/budget - Obtener presupuesto de un departamento
router.get('/departments/:id', getDepartmentBudget);

// PUT /api/departments/:id/budget - Actualizar presupuesto de un departamento
router.put('/departments/:id', updateDepartmentBudget);

export default router;
