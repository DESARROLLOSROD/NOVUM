import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  costCenter?: string;
  manager?: mongoose.Types.ObjectId;
  budget: {
    year: number;
    total: number;
    consumed: number;
    currency: 'MXN' | 'USD';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: [true, 'El nombre del departamento es requerido'],
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'El código del departamento es requerido'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  costCenter: {
    type: String,
    trim: true,
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  budget: {
    year: { type: Number, required: true, default: new Date().getFullYear() },
    total: { type: Number, required: true, min: 0, default: 0 },
    consumed: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ['MXN', 'USD'], default: 'MXN' },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
    }
  },
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
    }
  }
});

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
