import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { dokumenRoutes } from './routes/dokumen';
import { pemeriksaanRoutes } from './routes/pemeriksaan';
import { draftRoutes } from './routes/draft';
import { uploadRoutes } from './routes/upload';
import { biroRoutes } from './routes/biro';
import { skorRoutes } from './routes/skor';
import { revisiRoutes } from './routes/revisi';
import { fileRefRoutes } from './routes/fileRef';
import { llmRoutes } from './routes/llm';

export type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  AI: Ai;
  JWT_SECRET: string;
  FRONTEND_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'https://si-verena.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Public routes
app.route('/api/auth', authRoutes);

// Protected routes
app.use('/api/*', authMiddleware);
app.route('/api/dokumen', dokumenRoutes);
app.route('/api/pemeriksaan', pemeriksaanRoutes);
app.route('/api/draft', draftRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/biro', biroRoutes);
app.route('/api/skor', skorRoutes);
app.route('/api/revisi', revisiRoutes);
app.route('/api/file-ref', fileRefRoutes);
app.route('/api/llm', llmRoutes);

// Health check
app.get('/api/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  version: '1.0.0'
}));

// Root
app.get('/', (c) => c.json({ 
  name: 'SI-VERENA API',
  description: 'Sistem Verifikasi Renja Sekretariat Daerah',
  docs: '/api/health'
}));

export default app;
