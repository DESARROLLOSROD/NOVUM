import mongoose, { Document, Schema } from 'mongoose';

export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_received' | 'received' | 'cancelled';

export interface IPOItem {
  itemNumber: number;
  description: string;
  category: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  unitPrice: number;
  tax: number;
  discount: number;
  totalPrice: number;
  requisitionRef?: mongoose.Types.ObjectId;
  requisitionItemNumber?: number;
}

export interface IPurchaseOrder extends Document {
  orderNumber: string;
  requisitions: mongoose.Types.ObjectId[];
  supplier: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  status: POStatus;
  orderDate: Date;
  expectedDeliveryDate: Date;
  deliveryAddress: string;
  paymentTerms: string;
  items: IPOItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  attachments?: string[];
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  goodsReceipts?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  requisitions: [{
    type: Schema.Types.ObjectId,
    ref: 'Requisition',
    index: true,
  }],
  supplier: {
    type: Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
    index: true,
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'sent', 'partially_received', 'received', 'cancelled'],
    default: 'draft',
    index: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expectedDeliveryDate: {
    type: Date,
    required: true,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  paymentTerms: {
    type: String,
    required: true,
  },
  items: [{
    itemNumber: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    requisitionRef: { type: Schema.Types.ObjectId, ref: 'Requisition' },
    requisitionItemNumber: { type: Number },
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  notes: {
    type: String,
  },
  attachments: [{ type: String }],
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalDate: {
    type: Date,
  },
  goodsReceipts: [{
    type: Schema.Types.ObjectId,
    ref: 'GoodsReceipt',
  }],
}, {
  timestamps: true,
});

// Índices compuestos
PurchaseOrderSchema.index({ status: 1, department: 1 });
PurchaseOrderSchema.index({ supplier: 1, status: 1, orderDate: -1 });
PurchaseOrderSchema.index({ buyer: 1, status: 1, orderDate: -1 });
PurchaseOrderSchema.index({ status: 1, orderDate: -1 });
PurchaseOrderSchema.index({ orderNumber: 1, status: 1 });

// Índice de texto
PurchaseOrderSchema.index({ 'items.description': 'text', notes: 'text' });

// Pre-save hook para calcular totales
PurchaseOrderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + itemSubtotal;
    }, 0);

    this.taxAmount = this.items.reduce((sum, item) => sum + item.tax, 0);
    this.discountAmount = this.items.reduce((sum, item) => sum + item.discount, 0);
    this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  }
  next();
});

export default mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
