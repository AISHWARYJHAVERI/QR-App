import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  qrValue: { type: String, required: true },
  scannedBy: { type: String, default: '' },
  timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
  scannedAt: { type: Date, default: Date.now },
  source: { type: String, default: 'scanner' },
}, { timestamps: true, toJSON: { virtuals: true } });

scanSchema.virtual('id').get(function () {
  return this._id.toString();
});

scanSchema.index({ scannedAt: -1 });
scanSchema.index({ timeSlot: 1, scannedAt: -1 });
scanSchema.index({ qrValue: 1 });
scanSchema.index({ qrValue: 1, scannedBy: 1, timeSlot: 1 });

export default mongoose.model('Scan', scanSchema);
