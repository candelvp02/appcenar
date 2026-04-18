import mongoose from 'mongoose';

const commerceTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  icon: String
}, { timestamps: true });

export default mongoose.model('CommerceType', commerceTypeSchema);