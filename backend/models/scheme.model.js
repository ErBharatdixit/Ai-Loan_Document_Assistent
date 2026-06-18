import mongoose from 'mongoose';

const schemeSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true },
    description: { type: String, required: true },
    criteria:    [String]   // list of eligibility criteria strings
  },
  { timestamps: true }
);

export default mongoose.model('Scheme', schemeSchema);
