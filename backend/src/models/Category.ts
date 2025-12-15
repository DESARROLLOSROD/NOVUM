import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  code: string;
  description?: string;
  parent?: mongoose.Types.ObjectId;
  level: number;
  path: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'El nombre de la categoría es requerido'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'El código de la categoría es requerido'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  level: {
    type: Number,
    default: 0,
  },
  path: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

CategorySchema.pre('save', async function (next) {
    if (this.parent && (this.isNew || this.isModified('parent'))) {
        const parentCategory = await mongoose.model('Category').findById(this.parent);
        if (parentCategory) {
            this.level = parentCategory.level + 1;
            this.path = `${parentCategory.path},${this.name}`;
        }
    } else if (!this.parent) {
        this.level = 0;
        this.path = this.name;
    }
    next();
});

export default mongoose.model<ICategory>('Category', CategorySchema);
