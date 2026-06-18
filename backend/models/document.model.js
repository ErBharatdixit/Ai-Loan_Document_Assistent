import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  shortSummary:    { type: String, default: '' },
  detailedSummary: { type: String, default: '' },
  highlights:      [String],
  actionItems:     [String]
}, { _id: false }); // embedded object, no separate ID needed

const documentSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName:   { type: String, required: true },
    fileType:   { type: String, required: true },
    filePath:   { type: String, required: true },
    summary:    { type: summarySchema, default: () => ({}) },
    uploadDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
