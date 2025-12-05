import { Router } from 'express';
import {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
    approvePurchaseOrder,
    sendPurchaseOrder,
} from '../controllers/purchaseOrderController';
import { protect, authorize } from '../middleware/auth';
import {
    createPurchaseOrderValidation,
    updatePurchaseOrderValidation,
    idValidation,
    paginationValidation,
} from '../middleware/validator';
import { createLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);

router.post(
    '/',
    authorize('purchasing', 'admin'),
    createLimiter,
    createPurchaseOrderValidation,
    createPurchaseOrder
);

router.get(
    '/',
    authorize('purchasing', 'finance', 'admin'),
    paginationValidation,
    getPurchaseOrders
);

router.get(
    '/:id',
    authorize('purchasing', 'finance', 'admin'),
    idValidation,
    getPurchaseOrderById
);

router.put(
    '/:id',
    authorize('purchasing', 'admin'),
    idValidation,
    updatePurchaseOrderValidation,
    updatePurchaseOrder
);

router.delete(
    '/:id',
    authorize('purchasing', 'admin'),
    idValidation,
    deletePurchaseOrder
);

router.post(
    '/:id/approve',
    authorize('finance', 'admin'),
    idValidation,
    approvePurchaseOrder
);

router.post(
    '/:id/send',
    authorize('purchasing', 'admin'),
    idValidation,
    sendPurchaseOrder
);

export default router;
