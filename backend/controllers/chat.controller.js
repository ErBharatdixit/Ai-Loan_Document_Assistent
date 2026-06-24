import { Chat, Document, Scheme } from '../db.js';
import { vectorStore } from '../vectorStore.js';
import { geminiService } from '../geminiService.js';

// Fallback schemes
const DEFAULT_SCHEMES = [
  `--- SCHEME: Pradhan Mantri Mudra Yojana (PMMY) ---
Description: Funding the unfunded. Loans up to 10 Lakhs for non-corporate, non-farm small/micro enterprises.
Eligibility Criteria:
- Age: 18 to 65 years
- Business: Service, manufacturing, retail, or trading
- Loan limit: Shishu (up to 50,000), Kishor (50k to 5L), Tarun (5L to 10L).`,

  `--- SCHEME: Chief Minister Yuva Swarozgar Yojana (CMYSY) ---
Description: Financial support for unemployed youth to set up service or industrial units.
Eligibility Criteria:
- Age: 18 to 40 years
- Education: Minimum 10th Class (High School) pass
- Business: Industrial sector (up to 25 Lakhs), Service sector (up to 10 Lakhs)
- Residence: State resident.`
];

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

    // Tools context buildup
    const userDocs = await Document.find({ userId: req.user.id }).lean();
    const uploadedDocs = userDocs.map(d => d.fileName);
    
    const dbSchemes = await Scheme.find().lean();
    let schemeTexts = dbSchemes.length > 0 
      ? dbSchemes.map(s => `--- SCHEME: ${s.name} ---\nDescription: ${s.description}\nEligibility Criteria: ${s.criteria.join('\n')}`)
      : DEFAULT_SCHEMES;

    const dbToolsContext = {
      schemes: schemeTexts,
      schemeDocsMap: {
        "Pradhan Mantri Mudra Yojana (PMMY)": ["Aadhaar Card", "PAN Card", "Business Quotation or Project Report", "Proof of Business Address (Utility bill, GST registration)", "Bank Statement (Last 6 Months)"],
        "Chief Minister Yuva Swarozgar Yojana (CMYSY)": ["Aadhaar Card", "10th Marksheet or Certificate", "Domicile Certificate", "Income Certificate", "Detailed Project Report (DPR)"],
        "Stand-Up India Scheme": ["Aadhaar Card", "PAN Card", "SC/ST Category Certificate (if applicable)", "Project Report for Greenfield venture", "Company Incorporation / Partnership Deed"]
      },
      uploadedDocs: uploadedDocs
    };

    // Step 3 — Send to Gemini with context
    const responseText = await geminiService.chatWithContext(
      message, matches, lastTenChats.reverse(), language, req.geminiApiKey, dbToolsContext
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
