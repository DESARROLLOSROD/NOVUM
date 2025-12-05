import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  code: string;
  name: string;
  costCenter: string;
  manager?: mongoose.Types.ObjectId;
  budget?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  code: {
    type: String,
    required: [true, 'El código del departamento es requerido'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'El nombre del departamento es requerido'],
    trim: true,
    unique: true,
  },
  costCenter: {
    type: String,
    required: [true, 'El centro de costos es requerido'],
    trim: true,
    unique: true,
    index: true,
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  budget: {
    type: Schema.Types.ObjectId,
    ref: 'Budget',
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Índices para consultas optimizadas
DepartmentSchema.index({ code: 1, isActive: 1 });
DepartmentSchema.index({ isActive: 1, name: 1 });

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
