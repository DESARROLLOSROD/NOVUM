import mongoose, { Document, Schema } from 'mongoose';

export interface IReceiptItem {
  poItemNumber: number;
  description: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string;
  condition: 'good' | 'damaged' | 'partial';
  notes?: string;
}

export interface IGoodsReceipt extends Document {
  receiptNumber: string;
  purchaseOrder: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  receiptDate: Date;
  deliveryNote?: string;
  items: IReceiptItem[];
  status: 'partial' | 'complete';
  warehouseLocation?: string;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GoodsReceiptSchema = new Schema<IGoodsReceipt>({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  purchaseOrder: {
    type: Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true,
    index: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  receiptDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  deliveryNote: {
    type: String,
    trim: true,
  },
  items: [{
    poItemNumber: { type: Number, required: true },
    description: { type: String, required: true },
    orderedQuantity: { type: Number, required: true, min: 0 },
    receivedQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    condition: { type: String, enum: ['good', 'damaged', 'partial'], default: 'good' },
    notes: { type: String },
  }],
  status: {
    type: String,
    enum: ['partial', 'complete'],
    default: 'complete',
    index: true,
  },
  warehouseLocation: {
    type: String,
  },
  notes: {
    type: String,
  },
  attachments: [{ type: String }],
}, {
  timestamps: true,
});

// Índices compuestos
GoodsReceiptSchema.index({ purchaseOrder: 1, receiptDate: -1 });
GoodsReceiptSchema.index({ receiver: 1, receiptDate: -1 });
GoodsReceiptSchema.index({ status: 1, receiptDate: -1 });

export default mongoose.model<IGoodsReceipt>('GoodsReceipt', GoodsReceiptSchema);
