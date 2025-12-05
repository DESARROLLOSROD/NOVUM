import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'approver' | 'purchasing' | 'finance' | 'warehouse' | 'requester';

export interface IUser extends Document {
  employeeCode: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: mongoose.Types.ObjectId;
  approvalLimit?: number;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  employeeCode: {
    type: String,
    required: [true, 'El código de empleado es requerido'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    select: false,
  },
  firstName: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'approver', 'purchasing', 'finance', 'warehouse', 'requester'],
    default: 'requester',
    required: true,
    index: true,
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    index: true,
  },
  approvalLimit: {
    type: Number,
    min: 0,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Índices compuestos para consultas optimizadas en Atlas
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ department: 1, role: 1 });
UserSchema.index({ email: 1, isActive: 1 });

// Hash de contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
