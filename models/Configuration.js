import mongoose from 'mongoose';

const configurationSchema = new mongoose.Schema({
  itbis: { type: Number, required: true, default: 18 }
});

export default mongoose.model('Configuration', configurationSchema);