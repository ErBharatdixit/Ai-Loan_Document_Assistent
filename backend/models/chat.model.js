import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message:    { type: String, required: true },
    response:   { type: String, required: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    timestamp:  { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('Chat', chatSchema);
