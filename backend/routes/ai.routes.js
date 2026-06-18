import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { checkGeminiKey }    from '../middleware/gemini.middleware.js';
import {
  checkEligibility,
  getMissingDocs,
  compareLoans
} from '../controllers/ai.controller.js';

const router = express.Router();

// POST /api/eligibility
router.post('/eligibility', authenticateToken, checkGeminiKey, checkEligibility);

// POST /api/missing-docs
router.post('/missing-docs', authenticateToken, checkGeminiKey, getMissingDocs);

// POST /api/compare
router.post('/compare', authenticateToken, checkGeminiKey, compareLoans);

export default router;
