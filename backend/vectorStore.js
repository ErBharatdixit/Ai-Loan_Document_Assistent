import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(__dirname, 'data', 'vector_store.json');

// Make sure directory exists
if (!fs.existsSync(path.dirname(STORE_PATH))) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

// Ensure the vector store file exists
if (!fs.existsSync(STORE_PATH)) {
  fs.writeFileSync(STORE_PATH, JSON.stringify([], null, 2));
}

// Cosine similarity helper
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate single embedding
async function getEmbedding(text, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Generate batch embeddings (optimizes API roundtrips)
async function getBatchEmbeddings(texts, apiKey) {
  if (texts.length === 0) return [];
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  // Gemini batch embedding API limit is typically around 100 requests
  const batchSize = 25;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    try {
      const response = await model.batchEmbedContents({
        requests: batch.map(text => ({
          content: { parts: [{ text }] }
        }))
      });
      const batchEmbeddings = response.embeddings.map(e => e.values);
      allEmbeddings.push(...batchEmbeddings);
    } catch (error) {
      console.warn('Batch embedding failed, falling back to individual embeddings: ', error.message);
      // Fallback to individual embeddings if batch fails
      for (const text of batch) {
        const emb = await getEmbedding(text, apiKey);
        allEmbeddings.push(emb);
      }
    }
  }

  return allEmbeddings;
}

export const vectorStore = {
  async readStore() {
    try {
      const data = await fs.promises.readFile(STORE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  async writeStore(data) {
    await fs.promises.writeFile(STORE_PATH, JSON.stringify(data, null, 2));
  },

  async addDocumentChunks(userId, documentId, chunks, apiKey) {
    const store = await this.readStore();
    
    // Get embeddings for all chunks in batch
    const embeddings = await getBatchEmbeddings(chunks, apiKey);

    const newEntries = chunks.map((text, idx) => ({
      id: `${documentId}_chunk_${idx}_${Date.now()}`,
      userId,
      documentId,
      text,
      embedding: embeddings[idx]
    }));

    store.push(...newEntries);
    await this.writeStore(store);
    return newEntries.length;
  },

  async deleteDocumentChunks(documentId) {
    const store = await this.readStore();
    const filtered = store.filter(entry => entry.documentId !== documentId);
    await this.writeStore(filtered);
    return store.length - filtered.length;
  },

  async search(userId, query, limit = 5, apiKey, documentId = null) {
    const store = await this.readStore();
    
    // Filter vectors belonging to this user (and optionally restricted to a specific document)
    let userVectors = store.filter(entry => entry.userId === userId);
    if (documentId) {
      userVectors = userVectors.filter(entry => entry.documentId === documentId);
    }

    if (userVectors.length === 0) {
      return [];
    }

    // Embed the search query
    const queryEmbedding = await getEmbedding(query, apiKey);

    // Calculate similarity scores
    const results = userVectors.map(entry => {
      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      return {
        text: entry.text,
        documentId: entry.documentId,
        score
      };
    });

    // Sort by score descending and return top matches
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
};
