import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Requisition from '../models/Requisition';
import PurchaseOrder from '../models/PurchaseOrder';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('No autorizado', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Filtro por departamento si no es admin/finance/purchasing
    const filter: any = {};
    if (!['admin', 'finance', 'purchasing'].includes(user.role)) {
      filter.department = user.department;
    }

    // KPIs básicos
    const totalRequisitions = await Requisition.countDocuments(filter);
    const pendingRequisitions = await Requisition.countDocuments({
      ...filter,
      status: { $in: ['pending', 'in_approval'] }
    });
    const approvedRequisitions = await Requisition.countDocuments({
      ...filter,
      status: 'approved'
    });
    const rejectedRequisitions = await Requisition.countDocuments({
      ...filter,
      status: 'rejected'
    });

    // Total gastado (requisiciones aprobadas)
    const totalSpentResult = await Requisition.aggregate([
      { $match: { ...filter, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Tendencia de gastos por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const spendingTrend = await Requisition.aggregate([
      {
        $match: {
          ...filter,
          status: 'approved',
          requestDate: { $gte: sixMonthsAgo }
        }
      },
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

    // Top 5 categorías
    const topCategories = await Requisition.aggregate([
      { $match: { ...filter, status: 'approved' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          totalAmount: { $sum: '$items.totalPrice' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } }
    ]);

    // Distribución por departamento (solo para admin/finance)
    let byDepartment = [];
    if (['admin', 'finance'].includes(user.role)) {
      byDepartment = await Requisition.aggregate([
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
        { $unwind: { path: '$departmentData', preserveNullAndEmptyArrays: true } },
        { $sort: { total: -1 } },
        { $limit: 10 }
      ]);
    }

    // Tiempo promedio de aprobación (en horas)
    const avgApprovalTimeResult = await Requisition.aggregate([
      { $match: { ...filter, status: 'approved' } },
      {
        $addFields: {
          lastApprovalDate: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$approvalHistory',
                  as: 'approval',
                  cond: { $eq: ['$$approval.status', 'approved'] }
                }
              },
              -1
            ]
          }
        }
      },
      {
        $addFields: {
          approvalTime: {
            $subtract: ['$lastApprovalDate.date', '$requestDate']
          }
        }
      },
      {
        $match: {
          approvalTime: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$approvalTime' }
        }
      }
    ]);

    // Calcular tasa de aprobación
    const approvalRate = totalRequisitions > 0
      ? (approvedRequisitions / totalRequisitions) * 100
      : 0;

    // Convertir tiempo promedio a horas
    const avgApprovalTimeHours = avgApprovalTimeResult[0]?.avgTime
      ? avgApprovalTimeResult[0].avgTime / (1000 * 60 * 60)
      : 0;

    logger.info(`Dashboard stats requested by ${user.email}`);

    res.json({
      success: true,
      data: {
        kpis: {
          totalRequisitions,
          pendingRequisitions,
          approvedRequisitions,
          rejectedRequisitions,
          totalSpent: totalSpentResult[0]?.total || 0,
          approvalRate: Math.round(approvalRate * 10) / 10,
          avgApprovalTimeHours: Math.round(avgApprovalTimeHours * 10) / 10
        },
        charts: {
          spendingTrend: spendingTrend.map(item => ({
            month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
            amount: item.total,
            count: item.count
          })),
          topCategories: topCategories.map(item => ({
            name: item.categoryData?.name || 'Sin categoría',
            amount: item.totalAmount,
            count: item.count
          })),
          byDepartment: byDepartment.map(item => ({
            name: item.departmentData?.name || 'Sin departamento',
            amount: item.total,
            count: item.count
          }))
        }
      }
    });
  } catch (error) {
    logger.error('Error obteniendo stats del dashboard:', error);
    throw error;
  }
};
