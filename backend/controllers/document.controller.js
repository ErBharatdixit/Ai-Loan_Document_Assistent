import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document } from '../db.js';
import { extractTextFromFile, chunkText } from '../documentProcessor.js';
import { vectorStore } from '../vectorStore.js';
import { geminiService } from '../geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// POST /api/documents/upload
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath     = req.file.path;
    const mimeType     = req.file.mimetype;
    const originalName = req.file.originalname;

    // Step 1 — Extract text from the uploaded file
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(filePath, mimeType, req.geminiApiKey);
    } catch (err) {
      fs.unlinkSync(filePath); // Remove bad file
      return res.status(422).json({ error: `Text extraction failed: ${err.message}` });
    }

    if (!extractedText || extractedText.trim() === '') {
      fs.unlinkSync(filePath);
      return res.status(422).json({ error: 'The uploaded file contains no readable text.' });
    }

    // Step 2 — Generate AI summary
    let summaryObj = { shortSummary: '', detailedSummary: '', highlights: [], actionItems: [] };
    try {
      summaryObj = await geminiService.generateSummary(extractedText, req.geminiApiKey);
    } catch (err) {
      console.warn('Summary generation failed:', err.message);
      summaryObj.shortSummary = extractedText.substring(0, 200) + '...';
    }

    // Step 3 — Save document record in MongoDB
    const newDoc = await Document.create({
      userId:     req.user.id,
      fileName:   originalName,
      fileType:   mimeType,
      filePath:   `/uploads/${req.file.filename}`,
      summary:    summaryObj,
      uploadDate: new Date()
    });

    // Step 4 — Create vector embeddings for semantic search
    const chunks = chunkText(extractedText, 800, 150);
    try {
      await vectorStore.addDocumentChunks(req.user.id, newDoc._id.toString(), chunks, req.geminiApiKey);
    } catch (err) {
      console.error('Vector embedding failed:', err.message);
      // Document is still saved; just won't be searchable
    }

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/documents
export const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.id }).sort({ uploadDate: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    const docId = req.params.id;
    const doc   = await Document.findOne({ _id: docId, userId: req.user.id });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // 1. Delete the physical file from disk
    const localFilePath = path.join(__dirname, '..', doc.filePath);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    // 2. Remove from MongoDB
    await Document.deleteOne({ _id: docId });

    // 3. Remove vector embeddings
    await vectorStore.deleteDocumentChunks(docId);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
