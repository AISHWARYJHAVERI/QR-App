import mongoose from 'mongoose';

const superAdminSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'main' },
  days: { type: [Number], default: [] },
  times: { type: [String], default: [] },
  permissions: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('SuperAdminSettings', superAdminSettingsSchema);
