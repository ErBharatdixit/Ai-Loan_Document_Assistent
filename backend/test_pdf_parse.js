import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { extractTextFromFile } from './documentProcessor.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testParsing() {
  const testFilePath = path.join(__dirname, 'test_scheme_document.pdf');
  const mimeType = 'application/pdf';

  console.log(`Loading PDF: ${testFilePath}`);
  if (!fs.existsSync(testFilePath)) {
    console.error('Error: PDF file does not exist.');
    return;
  }

  try {
    // Extract using documentProcessor's function
    // We pass the API key from .env to test the Gemini PDF OCR fallback
    const text = await extractTextFromFile(testFilePath, mimeType, process.env.GEMINI_API_KEY);
    
    console.log('\n--- SUCCESS! PARSED PDF CONTENT ---');
    console.log(text);
    console.log('-----------------------------------\n');
    console.log(`Character Count: ${text.length}`);
  } catch (error) {
    console.error('Failed to parse PDF:', error);
  }
}

testParsing();
