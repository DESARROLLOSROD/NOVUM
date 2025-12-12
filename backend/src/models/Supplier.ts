import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  supplierCode: string;
  businessName: string;
  tradeName?: string;
  taxId: string;
  email: string;
  phone: string;
  website?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    position?: string;
    email: string;
    phone: string;
  };
  paymentTerms: string;
  categories: mongoose.Types.ObjectId[];
  rating?: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>({
  supplierCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
  },
  tradeName: {
    type: String,
    trim: true,
  },
  taxId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'México' },
  },
  contactPerson: {
    name: { type: String, required: true },
    position: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  paymentTerms: {
    type: String,
    required: true,
    default: 'Contado',
  },
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category',
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos
SupplierSchema.index({ isActive: 1, businessName: 1 });
SupplierSchema.index({ categories: 1, isActive: 1 });
SupplierSchema.index({ supplierCode: 1, isActive: 1 });

// Índice de texto para búsquedas
SupplierSchema.index({ businessName: 'text', tradeName: 'text', supplierCode: 'text' });

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);
