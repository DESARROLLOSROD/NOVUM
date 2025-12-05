import mongoose, { Document, Schema } from 'mongoose';

export interface ISequence extends Document {
  name: string;
  prefix: string;
  currentValue: number;
  year: number;
  padding: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISequenceModel extends mongoose.Model<ISequence> {
  getNextSequence(sequenceName: string): Promise<string>;
}

const SequenceSchema = new Schema<ISequence>({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  prefix: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  currentValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  year: {
    type: Number,
    required: true,
    index: true,
  },
  padding: {
    type: Number,
    default: 5,
    min: 1,
  },
}, {
  timestamps: true,
});

// Índice compuesto para búsquedas por nombre y año
SequenceSchema.index({ name: 1, year: 1 }, { unique: true });

// Método estático para obtener el siguiente número
SequenceSchema.statics.getNextSequence = async function (sequenceName: string): Promise<string> {
  const currentYear = new Date().getFullYear();

  const sequence = await this.findOneAndUpdate(
    { name: sequenceName, year: currentYear },
    { $inc: { currentValue: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (!sequence) {
    throw new Error(`No se pudo generar la secuencia para ${sequenceName}`);
  }

  const paddedNumber = sequence.currentValue.toString().padStart(sequence.padding, '0');
  return `${sequence.prefix}-${currentYear}-${paddedNumber}`;
};

export default mongoose.model<ISequence, ISequenceModel>('Sequence', SequenceSchema);
