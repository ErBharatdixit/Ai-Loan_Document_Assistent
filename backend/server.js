import express from 'express';
import cors    from 'cors';

import { PORT }        from './config/env.js';
import connectDB       from './config/db.js';
import { UPLOADS_DIR } from './middleware/upload.middleware.js';

import authRoutes     from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import chatRoutes     from './routes/chat.routes.js';
import aiRoutes       from './routes/ai.routes.js';
import healthRoutes   from './routes/health.routes.js';

// Connect to MongoDB before starting the server
await connectDB();

const app = express();

// --- Global Middleware ---
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ai-loan-document-assistent-1.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static(UPLOADS_DIR));

// --- API Routes ---
app.use('/api/auth',      authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/health',    healthRoutes);
app.use('/api',           aiRoutes);  // /api/eligibility, /api/missing-docs, /api/compare

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
