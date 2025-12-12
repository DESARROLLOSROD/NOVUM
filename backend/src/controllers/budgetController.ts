import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Department from '../models/Department';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

// GET /api/departments/:id/budget
export const getDepartmentBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const { id } = req.params;

    // Verificar permisos: solo admin, finance o el manager del departamento
    const department = await Department.findById(id).populate('manager', 'firstName lastName email');
    if (!department) {
      throw new AppError('Departamento no encontrado', 404);
    }

    const isAuthorized =
      ['admin', 'finance'].includes(user.role) ||
      (department.manager && department.manager._id.toString() === user._id.toString());

    if (!isAuthorized) {
      throw new AppError('No tienes permisos para ver este presupuesto', 403);
    }

    logger.info(`Budget info requested for department ${department.code} by ${user.email}`);

    res.json({
      success: true,
      data: {
        department: {
          id: department._id,
          code: department.code,
          name: department.name,
          costCenter: department.costCenter,
        },
        budget: department.budget || {
          annual: 0,
          spent: 0,
          committed: 0,
          available: 0,
          fiscalYear: new Date().getFullYear(),
          alerts: [],
          lastUpdated: new Date(),
        },
      },
    });
  } catch (error) {
    logger.error('Error obteniendo presupuesto del departamento:', error);
    throw error;
  }
};

// PUT /api/departments/:id/budget
export const updateDepartmentBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Solo admin y finance pueden actualizar presupuestos
    if (!['admin', 'finance'].includes(user.role)) {
      throw new AppError('No tienes permisos para actualizar presupuestos', 403);
    }

    const { id } = req.params;
    const { annual, alerts, fiscalYear } = req.body;

    const department = await Department.findById(id);
    if (!department) {
      throw new AppError('Departamento no encontrado', 404);
    }

    // Validar datos
    if (annual !== undefined && annual < 0) {
      throw new AppError('El presupuesto anual debe ser mayor o igual a 0', 400);
    }

    if (alerts && Array.isArray(alerts)) {
      for (const alert of alerts) {
        if (!alert.percentage || alert.percentage < 0 || alert.percentage > 100) {
          throw new AppError('Los porcentajes de alerta deben estar entre 0 y 100', 400);
        }
      }
    }

    // Actualizar presupuesto
    if (!department.budget) {
      department.budget = {
        annual: 0,
        spent: 0,
        committed: 0,
        available: 0,
        fiscalYear: new Date().getFullYear(),
        alerts: [],
        lastUpdated: new Date(),
      };
    }

    if (annual !== undefined) {
      department.budget.annual = annual;
    }

    if (fiscalYear !== undefined) {
      department.budget.fiscalYear = fiscalYear;
    }

    if (alerts !== undefined) {
      department.budget.alerts = alerts.map((alert: any) => ({
        percentage: alert.percentage,
        triggered: false,
        triggeredDate: undefined,
      }));
    }

    await department.save();

    logger.info(`Budget updated for department ${department.code} by ${user.email}`);

    res.json({
      success: true,
      message: 'Presupuesto actualizado exitosamente',
      data: {
        department: {
          id: department._id,
          code: department.code,
          name: department.name,
          costCenter: department.costCenter,
        },
        budget: department.budget,
      },
    });
  } catch (error) {
    logger.error('Error actualizando presupuesto del departamento:', error);
    throw error;
  }
};

// GET /api/budgets/summary - Resumen de todos los presupuestos
export const getBudgetsSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Solo admin y finance pueden ver resumen de todos los presupuestos
    if (!['admin', 'finance'].includes(user.role)) {
      throw new AppError('No tienes permisos para ver el resumen de presupuestos', 403);
    }

    const departments = await Department.find({ isActive: true })
      .populate('manager', 'firstName lastName email')
      .sort({ name: 1 });

    const summary = departments.map((dept) => ({
      id: dept._id,
      code: dept.code,
      name: dept.name,
      costCenter: dept.costCenter,
      manager: dept.manager,
      budget: dept.budget || {
        annual: 0,
        spent: 0,
        committed: 0,
        available: 0,
        fiscalYear: new Date().getFullYear(),
        alerts: [],
        lastUpdated: new Date(),
      },
    }));

    // Calcular totales
    const totals = summary.reduce(
      (acc, dept) => ({
        annual: acc.annual + (dept.budget?.annual || 0),
        spent: acc.spent + (dept.budget?.spent || 0),
        committed: acc.committed + (dept.budget?.committed || 0),
        available: acc.available + (dept.budget?.available || 0),
      }),
      { annual: 0, spent: 0, committed: 0, available: 0 }
    );

    logger.info(`Budget summary requested by ${user.email}`);

    res.json({
      success: true,
      data: {
        departments: summary,
        totals,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo resumen de presupuestos:', error);
    throw error;
  }
};
