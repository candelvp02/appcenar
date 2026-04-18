import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  commerceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);