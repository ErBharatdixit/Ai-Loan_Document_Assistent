import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { withRetry } from './utils/withRetry.js';

// Helper to initialize Gemini
function getModel(apiKey, modelName = 'gemini-2.0-flash', jsonSchema = null) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const config = {};
  
  if (jsonSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = jsonSchema;
  }
  
  return genAI.getGenerativeModel({ model: modelName, generationConfig: config });
}

export const geminiService = {
  // RAG Chat
  async chatWithContext(query, contextChunks, history = [], language = 'English', apiKey, dbToolsContext = null) {
    const tools = [
      {
        functionDeclarations: [
          {
            name: "check_eligibility",
            description: "Check if the user is eligible for government schemes.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                age: { type: SchemaType.NUMBER, description: "User age" },
                education: { type: SchemaType.STRING, description: "Education level" },
                businessType: { type: SchemaType.STRING, description: "Type of business" },
                investmentAmount: { type: SchemaType.NUMBER, description: "Investment amount" }
              },
              required: ["age", "education", "businessType", "investmentAmount"]
            }
          },
          {
            name: "detect_missing_docs",
            description: "Check which documents are missing for a specific scheme.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                schemeName: { type: SchemaType.STRING, description: "Name of the government scheme" }
              },
              required: ["schemeName"]
            }
          },
          {
            name: "compare_loans",
            description: "Compares multiple loan offers to extract parameters and calculate the best recommendation.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                loansList: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      bankName: { type: SchemaType.STRING },
                      interestRate: { type: SchemaType.STRING },
                      processingFee: { type: SchemaType.STRING },
                      maxLoanAmount: { type: SchemaType.STRING },
                      repaymentPeriod: { type: SchemaType.STRING }
                    }
                  },
                  description: "List of loan offers to compare"
                }
              },
              required: ["loansList"]
            }
          }
        ]
      }
    ];

    const contextText = contextChunks.map((chunk, i) => `[Context ${i+1}]:\n${chunk.text}\n`).join('\n');
    
    const systemInstruction = `
You are a highly helpful financial and government document assistant.
You help small business owners, students, and families understand documents.
Provide your response in ${language}. If the language is Hindi, translate terms accurately and use clear Hindi text.

Rules:
1. Answer the user's question using the provided Context or Tools.
2. If the user asks about eligibility, use the 'check_eligibility' tool. Ask for missing profile info if needed (age, education, business type, investment amount).
3. If the user asks about missing documents, use the 'detect_missing_docs' tool. You must pass a clear schemeName like "Pradhan Mantri Mudra Yojana (PMMY)".
4. Be precise, polite, and professional.
5. When referencing context information, cite the context index (e.g. [Context 1]).

Available Context:
${contextText}
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }]
      }
    });

    // Format history for startChat
    const formattedHistory = [];
    for (const h of history) {
      formattedHistory.push({ role: 'user', parts: [{ text: h.message }] });
      formattedHistory.push({ role: 'model', parts: [{ text: h.response }] });
    }

    const chat = model.startChat({
      history: formattedHistory,
      tools: tools
    });

    let result = await withRetry(() => chat.sendMessage(query));

    // Check if the model decided to call a function
    if (result.response.functionCalls && result.response.functionCalls.length > 0) {
      const call = result.response.functionCalls[0];
      let toolResult = {};
      
      try {
        if (call.name === 'check_eligibility') {
          const profile = call.args;
          const schemesTextList = dbToolsContext?.schemes || [];
          toolResult = await this.checkEligibility(profile, schemesTextList, apiKey);
        } 
        else if (call.name === 'detect_missing_docs') {
          const schemeName = call.args.schemeName;
          const requiredDocs = dbToolsContext?.schemeDocsMap?.[schemeName] || [];
          const uploadedDocs = dbToolsContext?.uploadedDocs || [];
          toolResult = await this.detectMissingDocuments(schemeName, requiredDocs, uploadedDocs, apiKey);
        }
        else if (call.name === 'compare_loans') {
          const loansList = call.args.loansList || [];
          toolResult = await this.compareLoans(loansList, apiKey);
        }
      } catch (err) {
        toolResult = { error: err.message };
      }

      // Send the tool response back to the model
      result = await withRetry(() => chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: toolResult
        }
      }]));
    }

    return result.response.text();
  },

  // Document Summary (Structured Output)
  async generateSummary(documentText, apiKey) {
    const summarySchema = {
      type: SchemaType.OBJECT,
      properties: {
        shortSummary: {
          type: SchemaType.STRING,
          description: "A 2-3 sentence overview of what the document is and its main purpose."
        },
        detailedSummary: {
          type: SchemaType.STRING,
          description: "A comprehensive summary of the main points, clauses, or conditions."
        },
        highlights: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "List of key highlights, interest rates, values, eligibility details, or crucial dates."
        },
        actionItems: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "List of actionable steps required by the user (e.g., documents to prepare, sites to visit, fees to pay)."
        }
      },
      required: ["shortSummary", "detailedSummary", "highlights", "actionItems"]
    };

    const model = getModel(apiKey, 'gemini-2.0-flash', summarySchema);
    const prompt = `Analyze the following document and output a structured summary in JSON format matching the schema:\n\n${documentText}`;
    
    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return JSON.parse(response.text());
  },

  // Eligibility Checker (Structured Output)
  async checkEligibility(profile, schemesTextList, apiKey) {
    const eligibilitySchema = {
      type: SchemaType.OBJECT,
      properties: {
        schemes: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              schemeName: { type: SchemaType.STRING },
              status: { 
                type: SchemaType.STRING, 
                enum: ["Eligible", "Potentially Eligible", "Ineligible"] 
              },
              reason: { type: SchemaType.STRING, description: "Detailed explanation of why they are eligible, potentially eligible, or ineligible." },
              requiredDocuments: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "List of documents needed to apply for this scheme."
              },
              nextSteps: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "Step-by-step action items for the application."
              }
            },
            required: ["schemeName", "status", "reason", "requiredDocuments", "nextSteps"]
          }
        }
      },
      required: ["schemes"]
    };

    const model = getModel(apiKey, 'gemini-2.0-flash', eligibilitySchema);
    const profileStr = JSON.stringify(profile, null, 2);
    
    const prompt = `
Evaluate the user's profile against the available scheme documents.
User Profile:
${profileStr}

Schemes Information:
${schemesTextList.join('\n\n')}

Determine eligibility, reasons, document requirements, and next steps. Output in structured JSON matching the schema.
    `;

    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return JSON.parse(response.text());
  },

  // Missing Document Detection
  async detectMissingDocuments(schemeName, requiredDocs, uploadedDocs, apiKey) {
    const missingDocsSchema = {
      type: SchemaType.OBJECT,
      properties: {
        missing: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              documentName: { type: SchemaType.STRING },
              importance: { type: SchemaType.STRING, enum: ["Mandatory", "Optional", "Recommended"] },
              relevance: { type: SchemaType.STRING, description: "Why is this document needed for the scheme?" }
            },
            required: ["documentName", "importance", "relevance"]
          }
        },
        uploadedCount: { type: SchemaType.INTEGER },
        missingCount: { type: SchemaType.INTEGER },
        summary: { type: SchemaType.STRING, description: "Quick summary recommendation." }
      },
      required: ["missing", "uploadedCount", "missingCount", "summary"]
    };

    const model = getModel(apiKey, 'gemini-2.0-flash', missingDocsSchema);
    const prompt = `
For the scheme "${schemeName}", the required document types are:
${JSON.stringify(requiredDocs, null, 2)}

The user has uploaded the following files:
${JSON.stringify(uploadedDocs, null, 2)}

Match the uploaded files to the required document types. Detect which ones are missing, rate their importance, and provide a short summary of recommendations.
    `;

    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return JSON.parse(response.text());
  },

  // Loan Comparison Assistant
  async compareLoans(loansList, apiKey) {
    const compareSchema = {
      type: SchemaType.OBJECT,
      properties: {
        comparisonTable: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              bankName: { type: SchemaType.STRING },
              interestRate: { type: SchemaType.STRING },
              processingFee: { type: SchemaType.STRING },
              maxLoanAmount: { type: SchemaType.STRING },
              repaymentPeriod: { type: SchemaType.STRING },
              keyPros: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              keyCons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["bankName", "interestRate", "processingFee", "maxLoanAmount", "repaymentPeriod", "keyPros", "keyCons"]
          }
        },
        bestRecommendation: {
          type: SchemaType.OBJECT,
          properties: {
            recommendedBank: { type: SchemaType.STRING },
            reason: { type: SchemaType.STRING },
            savingsComparison: { type: SchemaType.STRING, description: "Why this option saves money or is more suitable." }
          },
          required: ["recommendedBank", "reason", "savingsComparison"]
        }
      },
      required: ["comparisonTable", "bestRecommendation"]
    };

    const model = getModel(apiKey, 'gemini-2.0-flash', compareSchema);
    const prompt = `
Compare the following loan offers/options:
${JSON.stringify(loansList, null, 2)}

Extract key parameters (interest rates, fees, periods, pros, cons) into a tabular structure and calculate the best recommendation. Output in JSON format.
    `;

    const result = await withRetry(() => model.generateContent(prompt));
    const response = await result.response;
    return JSON.parse(response.text());
  }
};
