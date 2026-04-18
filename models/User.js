import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'client', 'delivery', 'commerce'], required: true },
  isActive: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  activationToken: String,

  // common data
  firstName: String,
  lastName: String,
  phone: String,
  photo: String,

  // delivery data
  isAvailable: { type: Boolean, default: true },

  // for commerce (rel 1:1 w commerce)
  commerceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commerce' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return await bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);