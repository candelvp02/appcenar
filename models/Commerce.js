import mongoose from 'mongoose';

const commerceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String, unique: true },
    logo: { type: String },
    openTime: { type: String },
    closeTime: { type: String },
    commerceType: { type: mongoose.Schema.Types.ObjectId, ref: 'CommerceType', required: true  },
}, { timestapms: true});

export default mongoose.model('Commerce', commerceSchema);
