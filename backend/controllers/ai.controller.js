import { Scheme } from '../db.js';
import { vectorStore } from '../vectorStore.js';
import { geminiService } from '../geminiService.js';

// Fallback schemes used when no documents or DB schemes exist
const DEFAULT_SCHEMES = [
  `--- SCHEME: PM Mudra Yojana ---
Description: Funding the unfunded. Loans up to 10 Lakhs for non-corporate, non-farm small/micro enterprises.
Eligibility Criteria:
- Age: 18 to 65 years
- Business: Service, manufacturing, retail, or trading
- Loan limit: Shishu (up to 50,000), Kishor (50k to 5L), Tarun (5L to 10L).`,

  `--- SCHEME: Chief Minister Yuva Swarozgar Yojana ---
Description: Financial support for unemployed youth to set up service or industrial units.
Eligibility Criteria:
- Age: 18 to 40 years
- Education: Minimum 10th Class (High School) pass
- Business: Industrial sector (up to 25 Lakhs), Service sector (up to 10 Lakhs)
- Residence: State resident.`
];

// POST /api/eligibility
export const checkEligibility = async (req, res) => {
  try {
    const { age, education, businessType, investmentAmount, schemeIds } = req.body;

    let schemeTexts = [];

    // Use uploaded scheme documents if provided
    if (schemeIds && schemeIds.length > 0) {
      const store = await vectorStore.readStore();
      for (const id of schemeIds) {
        const docChunks = store.filter(entry => entry.documentId === id);
        if (docChunks.length > 0) {
          schemeTexts.push(`--- SCHEME: ${id} ---\n` + docChunks.map(c => c.text).join('\n'));
        }
      }
    }

    // Fallback to DB schemes, then to hardcoded defaults
    if (schemeTexts.length === 0) {
      const schemes = await Scheme.find();
      if (schemes.length > 0) {
        schemeTexts = schemes.map(s =>
          `--- SCHEME: ${s.name} ---\nDescription: ${s.description}\nEligibility Criteria: ${s.criteria.join('\n')}`
        );
      } else {
        schemeTexts = DEFAULT_SCHEMES;
      }
    }

    const profile = { age, education, businessType, investmentAmount };
    const eligibilityReport = await geminiService.checkEligibility(profile, schemeTexts, req.geminiApiKey);

    res.json(eligibilityReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/missing-docs
export const getMissingDocs = async (req, res) => {
  try {
    const { schemeName, requiredDocs, uploadedDocIds } = req.body;

    // Import Document model here to avoid circular deps
    const { Document } = await import('../db.js');

    const docs = await Document.find({ userId: req.user.id, _id: { $in: uploadedDocIds } });
    const userUploadedFiles = docs.map(d => d.fileName);

    const report = await geminiService.detectMissingDocuments(schemeName, requiredDocs, userUploadedFiles, req.geminiApiKey);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/compare
export const compareLoans = async (req, res) => {
  try {
    const { loans } = req.body;

    if (!loans || !Array.isArray(loans) || loans.length === 0) {
      return res.status(400).json({ error: 'Loans comparison list is required' });
    }

    const comparison = await geminiService.compareLoans(loans, req.geminiApiKey);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
