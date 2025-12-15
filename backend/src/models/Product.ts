import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock' | 'overstock';
  code: string;
  name: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  unitOfMeasure: string;
  unitPrice?: number;
  currency: 'MXN' | 'USD';
  minStock?: number;
  maxStock?: number;
  currentStock?: number;
  reorderPoint?: number;
  preferredSupplier?: mongoose.Types.ObjectId;
  alternativeSuppliers?: mongoose.Types.ObjectId[];
  specifications?: {
    brand?: string;
    model?: string;
    manufacturer?: string;
    technicalSpecs?: string;
  };
  images?: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'El código del producto es requerido'],
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: [true, 'El nombre del producto es requerido'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es requerida']
    },
    unitOfMeasure: {
      type: String,
      required: [true, 'La unidad de medida es requerida'],
      enum: [
        'PZA', // Pieza
        'KG', // Kilogramo
        'LT', // Litro
        'MT', // Metro
        'M2', // Metro cuadrado
        'M3', // Metro cúbico
        'HR', // Hora
        'SRV', // Servicio
        'LOT', // Lote
        'PAQ', // Paquete
        'CJA', // Caja
        'GAL', // Galón
        'BOL', // Bolsa
        'ROL' // Rollo
      ],
      default: 'PZA'
    },
    unitPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      enum: ['MXN', 'USD'],
      default: 'MXN'
    },
    minStock: {
      type: Number,
      min: 0,
      default: 0
    },
    maxStock: {
      type: Number,
      min: 0
    },
    currentStock: {
      type: Number,
      min: 0,
      default: 0
    },
    reorderPoint: {
      type: Number,
      min: 0,
      default: 0
    },
    preferredSupplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    alternativeSuppliers: [{
      type: Schema.Types.ObjectId,
      ref: 'Supplier'
    }],
    specifications: {
      brand: String,
      model: String,
      manufacturer: String,
      technicalSpecs: String
    },
    images: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ preferredSupplier: 1 });

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function (this: IProduct) {
  if (this.currentStock === undefined || this.currentStock === 0) {
    return 'out_of_stock';
  }
  if (this.reorderPoint && this.currentStock <= this.reorderPoint) {
    return 'low_stock';
  }
  if (this.maxStock && this.currentStock >= this.maxStock) {
    return 'overstock';
  }
  return 'in_stock';
});

// Ensure virtuals are included in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
