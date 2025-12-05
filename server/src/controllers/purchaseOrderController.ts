import { Response } from 'express';
import { validationResult } from 'express-validator';
import PurchaseOrder from '../models/PurchaseOrder';
import Requisition from '../models/Requisition';
import Sequence from '../models/Sequence';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';

export const createPurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                errors: errors.array(),
            });
            return;
        }

        if (!req.user) {
            throw new AppError('No autorizado', 401);
        }

        const user = await User.findById(req.user.id);
        if (!user || !user.department) {
            throw new AppError('Usuario sin departamento asignado', 400);
        }

        const {
            requisitions,
            supplier,
            expectedDeliveryDate,
            deliveryAddress,
            paymentTerms,
            items,
            notes,
        } = req.body;

        // Verificar que las requisiciones existan y estén aprobadas
        if (requisitions && requisitions.length > 0) {
            const reqs = await Requisition.find({
                _id: { $in: requisitions },
                status: 'approved',
            });

            if (reqs.length !== requisitions.length) {
                throw new AppError('Algunas requisiciones no están aprobadas o no existen', 400);
            }
        }

        // Generar número de orden
        const orderNumber = await Sequence.getNextSequence('purchase-order');

        // Procesar items
        const processedItems = items.map((item: any, index: number) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            return {
                ...item,
                itemNumber: index + 1,
                totalPrice: itemSubtotal + (item.tax || 0) - (item.discount || 0),
            };
        });

        // Calcular totales
        const subtotal = processedItems.reduce((sum: number, item: any) => {
            return sum + (item.quantity * item.unitPrice);
        }, 0);

        const taxAmount = processedItems.reduce((sum: number, item: any) => sum + (item.tax || 0), 0);
        const discountAmount = processedItems.reduce((sum: number, item: any) => sum + (item.discount || 0), 0);
        const totalAmount = subtotal + taxAmount - discountAmount;

        const purchaseOrder = await PurchaseOrder.create({
            orderNumber,
            requisitions: requisitions || [],
            supplier,
            buyer: req.user.id,
            department: user.department,
            status: 'draft',
            orderDate: new Date(),
            expectedDeliveryDate,
            deliveryAddress,
            paymentTerms,
            items: processedItems,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            notes,
        });

        // Actualizar requisiciones si existen
        if (requisitions && requisitions.length > 0) {
            await Requisition.updateMany(
                { _id: { $in: requisitions } },
                {
                    $push: { purchaseOrders: purchaseOrder._id },
                    $set: { status: 'ordered' },
                }
            );
        }

        await purchaseOrder.populate('supplier buyer department items.category requisitions');

        logger.info(`Orden de compra creada: ${orderNumber} por ${user.email}`);

        res.status(201).json({
            success: true,
            data: purchaseOrder,
        });
    } catch (error) {
        logger.error('Error creando orden de compra:', error);
        throw error;
    }
};

export const getPurchaseOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('No autorizado', 401);
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const { status, supplier, department, search } = req.query;

        const filter: any = {};

        // Filtro por rol
        const user = await User.findById(req.user.id);
        if (user?.role === 'purchasing' || user?.role === 'finance' || user?.role === 'admin') {
            // Pueden ver todas las órdenes
        } else if (user?.department) {
            filter.department = user.department;
        }

        if (status) filter.status = status;
        if (supplier) filter.supplier = supplier;
        if (department) filter.department = department;
        if (search) {
            filter.$text = { $search: search as string };
        }

        const purchaseOrders = await PurchaseOrder.find(filter)
            .populate('supplier', 'name code')
            .populate('buyer', 'firstName lastName employeeCode')
            .populate('department', 'name code')
            .populate('items.category', 'name code')
            .sort({ orderDate: -1 })
            .limit(limit)
            .skip(skip);

        const total = await PurchaseOrder.countDocuments(filter);

        res.json({
            success: true,
            data: purchaseOrders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Error obteniendo órdenes de compra:', error);
        throw error;
    }
};

export const getPurchaseOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('No autorizado', 401);
        }

        const purchaseOrder = await PurchaseOrder.findById(req.params.id)
            .populate('supplier', 'name code taxId contactName email phone address')
            .populate('buyer', 'firstName lastName employeeCode email')
            .populate('department', 'name code costCenter')
            .populate('items.category', 'name code')
            .populate('requisitions')
            .populate('approvedBy', 'firstName lastName employeeCode')
            .populate('goodsReceipts');

        if (!purchaseOrder) {
            throw new AppError('Orden de compra no encontrada', 404);
        }

        res.json({
            success: true,
            data: purchaseOrder,
        });
    } catch (error) {
        logger.error('Error obteniendo orden de compra:', error);
        throw error;
    }
};

export const updatePurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('No autorizado', 401);
        }

        const purchaseOrder = await PurchaseOrder.findById(req.params.id);

        if (!purchaseOrder) {
            throw new AppError('Orden de compra no encontrada', 404);
        }

        if (purchaseOrder.status !== 'draft' && purchaseOrder.status !== 'pending_approval') {
            throw new AppError('Solo se pueden editar órdenes en borrador o pendientes de aprobación', 400);
        }

        const {
            supplier,
            expectedDeliveryDate,
            deliveryAddress,
            paymentTerms,
            items,
            notes,
        } = req.body;

        if (supplier) purchaseOrder.supplier = supplier;
        if (expectedDeliveryDate) purchaseOrder.expectedDeliveryDate = expectedDeliveryDate;
        if (deliveryAddress) purchaseOrder.deliveryAddress = deliveryAddress;
        if (paymentTerms) purchaseOrder.paymentTerms = paymentTerms;
        if (notes !== undefined) purchaseOrder.notes = notes;

        if (items) {
            const processedItems = items.map((item: any, index: number) => {
                const itemSubtotal = item.quantity * item.unitPrice;
                return {
                    ...item,
                    itemNumber: index + 1,
                    totalPrice: itemSubtotal + (item.tax || 0) - (item.discount || 0),
                };
            });
            purchaseOrder.items = processedItems;
        }

        await purchaseOrder.save();
        await purchaseOrder.populate('supplier buyer department items.category');

        logger.info(`Orden de compra actualizada: ${purchaseOrder.orderNumber}`);

        res.json({
            success: true,
            message: 'Orden de compra actualizada exitosamente',
            data: purchaseOrder,
        });
    } catch (error) {
        logger.error('Error actualizando orden de compra:', error);
        throw error;
    }
};

export const deletePurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('No autorizado', 401);
        }

        const purchaseOrder = await PurchaseOrder.findById(req.params.id);

        if (!purchaseOrder) {
            throw new AppError('Orden de compra no encontrada', 404);
        }

        if (purchaseOrder.status === 'received' || purchaseOrder.status === 'partially_received') {
            throw new AppError('No se puede cancelar una orden con recepciones de mercancía', 400);
        }

        purchaseOrder.status = 'cancelled';
        await purchaseOrder.save();

        // Actualizar requisiciones asociadas
        if (purchaseOrder.requisitions && purchaseOrder.requisitions.length > 0) {
            await Requisition.updateMany(
                { _id: { $in: purchaseOrder.requisitions } },
                {
                    $pull: { purchaseOrders: purchaseOrder._id },
                    $set: { status: 'approved' },
                }
            );
        }

        logger.info(`Orden de compra cancelada: ${purchaseOrder.orderNumber}`);

        res.json({
            success: true,
            message: 'Orden de compra cancelada exitosamente',
            data: purchaseOrder,
        });
    } catch (error) {
        logger.error('Error cancelando orden de compra:', error);
        throw error;
    }
};

export const approvePurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('No autorizado', 401);
        }

        const purchaseOrder = await PurchaseOrder.findById(req.params.id);

        if (!purchaseOrder) {
            throw new AppError('Orden de compra no encontrada', 404);
        }

        if (purchaseOrder.status !== 'pending_approval') {
            throw new AppError('La orden no está pendiente de aprobación', 400);
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            throw new AppError('Usuario no encontrado', 404);
        }

        purchaseOrder.status = 'approved';
        purchaseOrder.approvedBy = user._id;
        purchaseOrder.approvalDate = new Date();

        await purchaseOrder.save();

        logger.info(`Orden de compra aprobada: ${purchaseOrder.orderNumber} por ${user.email}`);

        res.json({
            success: true,
            message: 'Orden de compra aprobada exitosamente',
            data: purchaseOrder,
        });
    } catch (error) {
        logger.error('Error aprobando orden de compra:', error);
        throw error;
    }
};

export const sendPurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new AppError('No autorizado', 401);
        }

        const purchaseOrder = await PurchaseOrder.findById(req.params.id);

        if (!purchaseOrder) {
            throw new AppError('Orden de compra no encontrada', 404);
        }

        if (purchaseOrder.status !== 'approved') {
            throw new AppError('La orden debe estar aprobada antes de enviarla', 400);
        }

        purchaseOrder.status = 'sent';
        await purchaseOrder.save();

        logger.info(`Orden de compra enviada: ${purchaseOrder.orderNumber}`);

        res.json({
            success: true,
            message: 'Orden de compra enviada al proveedor',
            data: purchaseOrder,
        });
    } catch (error) {
        logger.error('Error enviando orden de compra:', error);
        throw error;
    }
};
