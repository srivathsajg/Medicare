import mongoose, { Schema, Document } from 'mongoose';

export interface IRecord extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  fileUrl?: string;
  verified: boolean; // Blockchain verification badge
  createdAt: Date;
}

const RecordSchema: Schema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Record || mongoose.model<IRecord>('Record', RecordSchema);
