import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withRetry } from './utils/withRetry.js';

// Text chunking utility
export function chunkText(text, chunkSize = 1000, chunkOverlap = 200) {
  if (!text) return [];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const cleanPara = para.trim().replace(/\s+/g, ' ');
    if (!cleanPara) continue;

    if ((currentChunk + ' ' + cleanPara).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${cleanPara}` : cleanPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // If paragraph itself is larger than chunk size, split it by sentences
      if (cleanPara.length > chunkSize) {
        const sentences = cleanPara.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleanPara];
        currentChunk = '';
        for (const sentence of sentences) {
          const cleanSentence = sentence.trim();
          if ((currentChunk + ' ' + cleanSentence).length <= chunkSize) {
            currentChunk = currentChunk ? `${currentChunk} ${cleanSentence}` : cleanSentence;
          } else {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = cleanSentence;
          }
        }
      } else {
        // Simple overlap implementation: take the last overlap characters
        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        const overlapText = currentChunk.substring(overlapStart).trim();
        currentChunk = overlapText ? `${overlapText}\n\n${cleanPara}` : cleanPara;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Extractor function supporting multiple document types
export async function extractTextFromFile(filePath, mimeType, apiKey) {
  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist');
  }

  const fileBuffer = await fs.promises.readFile(filePath);

  // 1. PDF
  if (mimeType === 'application/pdf') {
    try {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } catch (localError) {
      console.warn(`Local PDF parsing failed (${localError.message}). Attempting Gemini extraction fallback...`);
      
      if (!apiKey) {
        throw new Error(`Local PDF parsing failed: ${localError.message}. Set your Gemini API key for OCR/extraction fallback.`);
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        const base64Pdf = fileBuffer.toString('base64');
        const pdfPart = {
          inlineData: {
            data: base64Pdf,
            mimeType: 'application/pdf'
          }
        };

        const prompt = 'Extract all textual information, tables, headings, numbers, and details from this PDF document. Return it as readable markdown text. Do not add any conversational remarks, just return the exact extracted content.';
        const result = await withRetry(() => model.generateContent([prompt, pdfPart]));
        const response = await result.response;
        return response.text();
      } catch (geminiError) {
        throw new Error(`Both local PDF parser and Gemini extraction fallback failed. Gemini Error: ${geminiError.message}`);
      }
    }
  }

  // 2. Word Document (DOCX)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const data = await mammoth.extractRawText({ buffer: fileBuffer });
    return data.value;
  }

  // 3. Plain Text
  if (mimeType === 'text/plain') {
    return fileBuffer.toString('utf-8');
  }

  // 4. Image (multimodal extraction using Gemini)
  if (mimeType.startsWith('image/')) {
    if (!apiKey) {
      throw new Error('Gemini API key is required to perform OCR on image files.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const base64Image = fileBuffer.toString('base64');
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };

    const prompt = 'Extract all textual information, tables, numbers, names, dates, and details from this document image. Return it as readable markdown text. Do not add any conversational remarks, just the extracted content.';
    
    const result = await withRetry(() => model.generateContent([prompt, imagePart]));
    const response = await result.response;
    return response.text();
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
