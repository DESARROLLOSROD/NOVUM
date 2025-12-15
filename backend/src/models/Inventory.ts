import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  product: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  quantity: number;
  location?: string;
  lastUpdatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  location: {
    type: String,
    trim: true,
    uppercase: true,
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Ensure a product can only exist once per department inventory
InventorySchema.index({ product: 1, department: 1 }, { unique: true });

// Index for quick lookup by department
InventorySchema.index({ department: 1 });

export default mongoose.model<IInventory>('Inventory', InventorySchema);
