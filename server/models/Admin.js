import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'President' },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
}, { timestamps: true, toJSON: { virtuals: true } });

adminSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('Admin', adminSchema);
