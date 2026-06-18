import express from 'express';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// GET /api/health
// Checks MongoDB connection + Gemini API key in one go
router.get('/', async (req, res) => {
  const status = {
    mongodb: { ok: false, message: '' },
    gemini:  { ok: false, message: '' }
  };

  // --- 1. Check MongoDB ---
  const mongoState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoState === 1) {
    status.mongodb.ok = true;
    status.mongodb.message = '✅ Connected';
  } else {
    status.mongodb.message = `❌ Not connected (state: ${mongoState})`;
  }

  // --- 2. Check Gemini API Key ---
  const apiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    status.gemini.message = '❌ API key not provided';
  } else {
    try {
      // Make a minimal test call to Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      await model.generateContent('Say "ok" in one word.');
      status.gemini.ok = true;
      status.gemini.message = '✅ API key is valid and working';
    } catch (err) {
      status.gemini.message = `❌ API key error: ${err.message}`;
    }
  }

  const allOk = status.mongodb.ok && status.gemini.ok;
  res.status(allOk ? 200 : 500).json(status);
});

export default router;
