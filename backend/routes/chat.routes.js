import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkGeminiKey }    from '../middleware/gemini.middleware.js';
import {
  sendMessage,
  getChatHistory,
  clearChatHistory
} from '../controllers/chat.controller.js';

const router = express.Router();

// POST /api/chat
router.post('/', authenticateToken, checkGeminiKey, sendMessage);

// GET /api/chat/history
router.get('/history', authenticateToken, getChatHistory);

// DELETE /api/chat/history
router.delete('/history', authenticateToken, clearChatHistory);

export default router;
