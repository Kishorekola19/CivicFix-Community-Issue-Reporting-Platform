import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import { myIssues, summary } from './controllers/issueController.js';
import { allow, protect } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api/issues', issueRoutes);
app.get('/api/me/issues', protect, allow('reporter'), myIssues);
app.get('/api/coordinator/summary', protect, allow('coordinator'), summary);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use(notFound); app.use(errorHandler);
export default app;
