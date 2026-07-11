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

export default mongoose.model('Scan', scanSchema);
