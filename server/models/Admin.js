import mongoose from 'mongoose';
import crypto from 'crypto';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  // QR-only admins have no password and can never sign in.
  password: { type: String, default: '' },
  role: { type: String, default: 'President' },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
  qrOnly: { type: Boolean, default: false },
  // seed = original account, public = signed up from the modal,
  // qr = QR-only account, promoted = QR-only upgraded by the super admin.
  origin: { type: String, enum: ['seed', 'public', 'qr', 'promoted'], default: 'qr' },
  token: { type: String, default: null },
  tokenExpiresAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true } });

adminSchema.virtual('id').get(function () {
  return this._id.toString();
});

adminSchema.methods.issueToken = async function () {
  this.token = crypto.randomBytes(24).toString('hex');
  this.tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await this.save();
  return this.token;
};

adminSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    role: this.role,
    phone: this.phone,
    city: this.city,
    qrOnly: !!this.qrOnly,
    origin: this.origin || 'qr',
    createdAt: this.createdAt,
  };
};

export default mongoose.model('Admin', adminSchema);
