import mongoose, { Document, Schema } from 'mongoose';

export type RequisitionStatus = 'draft' | 'pending' | 'in_approval' | 'approved' | 'rejected' | 'cancelled' | 'partially_ordered' | 'ordered';

export interface IRequisitionItem {
  itemNumber: number;
  description: string;
  category: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  totalPrice: number;
  justification?: string;
  specifications?: string;
}

export interface IApprovalHistory {
  level: number;
  approver: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  date?: Date;
}

export interface IRequisition extends Document {
  requisitionNumber: string;
  requester: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  status: RequisitionStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestDate: Date;
  requiredDate: Date;
  title: string;
  description?: string;
  items: IRequisitionItem[];
  totalAmount: number;
  approvalHistory: IApprovalHistory[];
  currentApprovalLevel: number;
  attachments?: string[];
  rejectionReason?: string;
  purchaseOrders?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const RequisitionSchema = new Schema<IRequisition>({
  requisitionNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  requester: {
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
    enum: ['draft', 'pending', 'in_approval', 'approved', 'rejected', 'cancelled', 'partially_ordered', 'ordered'],
    default: 'draft',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true,
  },
  requestDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  requiredDate: {
    type: Date,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  items: [{
    itemNumber: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, required: true },
    estimatedPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    justification: { type: String },
    specifications: { type: String },
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  approvalHistory: [{
    level: { type: Number, required: true },
    approver: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comments: { type: String },
    date: { type: Date },
  }],
  currentApprovalLevel: {
    type: Number,
    default: 0,
  },
  attachments: [{ type: String }],
  rejectionReason: {
    type: String,
  },
  purchaseOrders: [{
    type: Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
  }],
}, {
  timestamps: true,
});

// Índices compuestos para consultas optimizadas
RequisitionSchema.index({ status: 1, department: 1 });
RequisitionSchema.index({ requester: 1, status: 1, requestDate: -1 });
RequisitionSchema.index({ department: 1, status: 1, requestDate: -1 });
RequisitionSchema.index({ status: 1, priority: 1, requestDate: -1 });
RequisitionSchema.index({ requisitionNumber: 1, status: 1 });
RequisitionSchema.index({ 'approvalHistory.approver': 1, 'approvalHistory.status': 1 });

// Índice de texto para búsquedas
RequisitionSchema.index({ title: 'text', description: 'text', 'items.description': 'text' });

// Pre-save hook para calcular total
RequisitionSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  next();
});

// Post-save hook para actualizar presupuesto del departamento
RequisitionSchema.post('save', async function(doc) {
  try {
    const Department = mongoose.model('Department');
    const department = await Department.findById(doc.department);

    if (!department || !department.budget) {
      return;
    }

    // Si la requisición está pendiente o en aprobación, actualizar comprometido
    if (doc.status === 'pending' || doc.status === 'in_approval') {
      // Calcular el total comprometido de este departamento
      const Requisition = mongoose.model('Requisition');
      const committedTotal = await Requisition.aggregate([
        {
          $match: {
            department: doc.department,
            status: { $in: ['pending', 'in_approval'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
          },
        },
      ]);

      department.budget.committed = committedTotal[0]?.total || 0;
    }

    // Si la requisición es aprobada, actualizar gastado y reducir comprometido
    if (doc.status === 'approved') {
      department.budget.spent += doc.totalAmount;

      // Recalcular comprometido
      const Requisition = mongoose.model('Requisition');
      const committedTotal = await Requisition.aggregate([
        {
          $match: {
            department: doc.department,
            status: { $in: ['pending', 'in_approval'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
          },
        },
      ]);

      department.budget.committed = committedTotal[0]?.total || 0;
    }

    // Si la requisición es rechazada o cancelada, reducir comprometido
    if (doc.status === 'rejected' || doc.status === 'cancelled') {
      // Recalcular comprometido
      const Requisition = mongoose.model('Requisition');
      const committedTotal = await Requisition.aggregate([
        {
          $match: {
            department: doc.department,
            status: { $in: ['pending', 'in_approval'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
          },
        },
      ]);

      department.budget.committed = committedTotal[0]?.total || 0;
    }

    await department.save();
  } catch (error) {
    console.error('Error actualizando presupuesto del departamento:', error);
  }
});

export default mongoose.model<IRequisition>('Requisition', RequisitionSchema);
