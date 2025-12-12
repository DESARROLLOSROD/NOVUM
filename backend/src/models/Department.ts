import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetAlert {
  percentage: number;
  triggered: boolean;
  triggeredDate?: Date;
}

export interface IBudgetData {
  annual: number;
  spent: number;
  committed: number;
  available: number;
  fiscalYear: number;
  alerts: IBudgetAlert[];
  lastUpdated: Date;
}

export interface IDepartment extends Document {
  code: string;
  name: string;
  costCenter: string;
  manager?: mongoose.Types.ObjectId;
  budget?: IBudgetData;
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
    annual: {
      type: Number,
      default: 0,
      min: 0,
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    committed: {
      type: Number,
      default: 0,
      min: 0,
    },
    available: {
      type: Number,
      default: 0,
      min: 0,
    },
    fiscalYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    alerts: [{
      percentage: { type: Number, required: true },
      triggered: { type: Boolean, default: false },
      triggeredDate: { type: Date },
    }],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
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

// Pre-save hook para calcular presupuesto disponible
DepartmentSchema.pre('save', function(next) {
  if (this.budget) {
    this.budget.available = this.budget.annual - this.budget.spent - this.budget.committed;
    this.budget.lastUpdated = new Date();

    // Verificar alertas
    if (this.budget.alerts && this.budget.alerts.length > 0) {
      const usagePercentage = ((this.budget.spent + this.budget.committed) / this.budget.annual) * 100;

      this.budget.alerts.forEach(alert => {
        if (usagePercentage >= alert.percentage && !alert.triggered) {
          alert.triggered = true;
          alert.triggeredDate = new Date();
        } else if (usagePercentage < alert.percentage && alert.triggered) {
          alert.triggered = false;
          alert.triggeredDate = undefined;
        }
      });
    }
  }
  next();
});

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
