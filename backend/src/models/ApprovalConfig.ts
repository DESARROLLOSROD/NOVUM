import mongoose, { Document, Schema } from 'mongoose';

export interface IApprovalLevel {
  order: number;
  name: string;
  role: string;
  approvalLimit?: number;
}

export interface IApprovalConfig extends Document {
  name: string;
  module: 'requisition' | 'purchase_order';
  minAmount: number;
  maxAmount?: number;
  levels: IApprovalLevel[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalConfigSchema = new Schema<IApprovalConfig>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  module: {
    type: String,
    enum: ['requisition', 'purchase_order'],
    required: true,
    index: true,
  },
  minAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  maxAmount: {
    type: Number,
    min: 0,
  },
  levels: [{
    order: { type: Number, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    approvalLimit: { type: Number, min: 0 },
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Índices compuestos
ApprovalConfigSchema.index({ module: 1, isActive: 1, minAmount: 1 });
ApprovalConfigSchema.index({ module: 1, minAmount: 1, maxAmount: 1 });

// Validación para asegurar que los niveles estén ordenados
ApprovalConfigSchema.pre('save', function(next) {
  if (this.levels && this.levels.length > 0) {
    this.levels.sort((a, b) => a.order - b.order);
  }
  next();
});

export default mongoose.model<IApprovalConfig>('ApprovalConfig', ApprovalConfigSchema);
