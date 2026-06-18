import { Chat } from '../db.js';
import { vectorStore } from '../vectorStore.js';
import { geminiService } from '../geminiService.js';

// POST /api/chat
export const sendMessage = async (req, res) => {
  try {
    const { message, documentId, language = 'English' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Step 1 — Find relevant document chunks via vector search
    const matches = await vectorStore.search(req.user.id, message, 6, req.geminiApiKey, documentId);

    // Step 2 — Load last 10 messages for conversation context
    const lastTenChats = await Chat.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Step 3 — Send to Gemini with context
    const responseText = await geminiService.chatWithContext(
      message, matches, lastTenChats.reverse(), language, req.geminiApiKey
    );

    // Step 4 — Save this exchange in MongoDB
    const chatRecord = await Chat.create({
      userId:     req.user.id,
      message,
      response:   responseText,
      documentId: documentId || null,
      timestamp:  new Date()
    });

    res.json({
      _id:       chatRecord._id,
      message:   chatRecord.message,
      response:  chatRecord.response,
      timestamp: chatRecord.timestamp,
      sources:   matches.map(m => ({ text: m.text, score: m.score }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/chat/history
export const getChatHistory = async (req, res) => {
  try {
    const history = await Chat.find({ userId: req.user.id }).sort({ timestamp: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/chat/history
export const clearChatHistory = async (req, res) => {
  try {
    await Chat.deleteMany({ userId: req.user.id });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
