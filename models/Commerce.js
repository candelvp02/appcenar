import mongoose from 'mongoose';

const commerceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  logo: String,
  phone: String,
  email: String,
  openingTime: String,
  closingTime: String,
  commerceTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommerceType', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Commerce', commerceSchema);