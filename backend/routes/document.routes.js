import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkGeminiKey }    from '../middleware/gemini.middleware.js';
import { upload }            from '../middleware/upload.middleware.js';
import {
  uploadDocument,
  getDocuments,
  deleteDocument
} from '../controllers/document.controller.js';

const router = express.Router();

// POST /api/documents/upload
router.post('/upload', authenticateToken, checkGeminiKey, upload.single('file'), uploadDocument);

// GET /api/documents
router.get('/', authenticateToken, getDocuments);

// DELETE /api/documents/:id
router.delete('/:id', authenticateToken, deleteDocument);

export default router;
