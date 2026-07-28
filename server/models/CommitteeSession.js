import mongoose from 'mongoose';

const entrySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
}, { _id: false });

const committeeSessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  entries: { type: [entrySchema], default: [] },
}, { timestamps: true, toJSON: { virtuals: true } });

committeeSessionSchema.virtual('id').get(function () {
  return this._id.toString();
});

export default mongoose.model('CommitteeSession', committeeSessionSchema);
