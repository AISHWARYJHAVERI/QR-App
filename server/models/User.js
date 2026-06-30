import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
}, { timestamps: true, toJSON: { virtuals: true } });

userSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('User', userSchema);
