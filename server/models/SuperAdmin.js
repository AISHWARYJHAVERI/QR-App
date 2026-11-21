import mongoose from 'mongoose';
import crypto from 'crypto';

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({
  salt,
  passwordHash: crypto.scryptSync(String(password), salt, 64).toString('hex'),
});

const superAdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  salt: { type: String, required: true },
  passwordHash: { type: String, required: true },
  sessionToken: { type: String, default: null },
  sessionExpiresAt: { type: Date, default: null },
}, { timestamps: true });

superAdminSchema.statics.hashPassword = hashPassword;

superAdminSchema.statics.ensureSeeded = async function () {
  let doc = await this.findOne({ username: 'aishwary' });
  if (!doc) {
    const { salt, passwordHash } = hashPassword('Jhaveri0304');
    doc = await this.create({ username: 'aishwary', salt, passwordHash });
  }
  return doc;
};

superAdminSchema.methods.verifyPassword = function (password) {
  const supplied = crypto.scryptSync(String(password), this.salt, 64);
  const stored = Buffer.from(this.passwordHash, 'hex');
  return supplied.length === stored.length && crypto.timingSafeEqual(supplied, stored);
};

export default mongoose.model('SuperAdmin', superAdminSchema);
