import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'requisition_created'
  | 'requisition_approved'
  | 'requisition_rejected'
  | 'requisition_cancelled'
  | 'budget_alert'
  | 'approval_required'
  | 'purchase_order_created';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedModel?: 'Requisition' | 'PurchaseOrder' | 'Department';
  relatedId?: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  sentByEmail: boolean;
  emailSentAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'requisition_created',
      'requisition_approved',
      'requisition_rejected',
      'requisition_cancelled',
      'budget_alert',
      'approval_required',
      'purchase_order_created',
    ],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  relatedModel: {
    type: String,
    enum: ['Requisition', 'PurchaseOrder', 'Department'],
  },
  relatedId: {
    type: Schema.Types.ObjectId,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  sentByEmail: {
    type: Boolean,
    default: false,
  },
  emailSentAt: {
    type: Date,
  },
  metadata: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Índices compuestos para consultas optimizadas
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
