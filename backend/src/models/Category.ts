import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  code: string;
  name: string;
  parent?: mongoose.Types.ObjectId;
  level: number;
  path: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  code: {
    type: String,
    required: [true, 'El código de categoría es requerido'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'El nombre de categoría es requerido'],
    trim: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
    index: true,
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  path: {
    type: String,
    required: [true, 'El path de categoría es requerido'],
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para jerarquías
CategorySchema.index({ parent: 1, isActive: 1 });
CategorySchema.index({ path: 1, level: 1 });
CategorySchema.index({ isActive: 1, level: 1 });

// Método para construir el path antes de validar
CategorySchema.pre('validate', async function (next) {
  try {
    // Siempre calcular path para documentos nuevos o si cambió parent/code
    if (this.isNew || this.isModified('parent') || this.isModified('code') || !this.path) {
      if (this.parent) {
        const parentCategory = await mongoose.model('Category').findById(this.parent);
        if (parentCategory) {
          this.path = `${(parentCategory as any).path}/${this.code}`;
          this.level = ((parentCategory as any).level || 0) + 1;
        } else {
          // Si no se encuentra el padre, tratar como categoría raíz
          this.path = this.code;
          this.level = 0;
        }
      } else {
        // Categoría raíz
        this.path = this.code;
        this.level = 0;
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.model<ICategory>('Category', CategorySchema);
