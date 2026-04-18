import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commerceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce', required: true },
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    productPrice: Number,
    quantity: { type: Number, default: 1 }
  }],
  subtotal: { type: Number, required: true },
  itbis: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);