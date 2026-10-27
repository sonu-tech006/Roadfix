import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { db } from './server/services/dbStore.ts';
import authRoutes from './server/routes/auth.ts';
import complaintsRoutes from './server/routes/complaints.ts';
import uploadRoutes from './server/routes/upload.ts';
import adminRoutes from './server/routes/admin.ts';
import notificationsRoutes from './server/routes/notifications.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads directory
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.get('/api/departments', async (_req, res) => {
  try {
    const list = await db.getDepartments();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching departments' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: 'RoadFix - Road Damage Reporting & Repair Accountability Platform',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

// Attempt MongoDB Atlas connection if MONGODB_URI is provided
const mongoUri = process.env.MONGODB_URI;
if (mongoUri && !mongoUri.includes('user:pass@cluster0')) {
  mongoose
    .connect(mongoUri, { serverSelectionTimeoutMS: 4000 })
    .then(() => {
      console.log('Connected to MongoDB Atlas successfully.');
    })
    .catch((err) => {
      console.warn('MongoDB connection note: fallback in-memory store active.', err.message);
    });
} else {
  console.log('Running RoadFix with integrated high-fidelity database store.');
}

async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RoadFix Server operational on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start RoadFix server:', err);
});
