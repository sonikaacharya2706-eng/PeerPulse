import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import { initSocket } from './services/socket.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import roomBookingRoutes from './routes/roomBookingRoutes.js';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import { initSlaCron } from './services/slaCron.js';
import eventRoutes from './routes/eventRoutes.js';
import { initEventReminderCron } from './services/eventReminderCron.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB connection
connectDB();

const app = express();
const server = http.createServer(app);

// Trust proxy for Render / load balancers
app.set('trust proxy', 1);

// Initialize Socket.io
initSocket(server);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration - strictly restricted to CLIENT_URL
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching CLIENT_URL
      if (!origin || origin === clientUrl) {
        callback(null, true);
      } else {
        callback(new Error(`CORS error: Origin ${origin} not allowed by CORS policy.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization against NoSQL injection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    });
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // accommodate real-time polling and multi-module loads
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // reasonable for testing login/register loops
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint (moved from '/')
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    success: true,
    message: 'Smart Campus Solutions API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    service: 'smart-campus-api',
  });
});

// Mount Phase 1 API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);

// Mount M1 API routes
app.use('/api/classrooms', classroomRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/rooms', roomBookingRoutes);
app.use('/api/bookings', roomBookingRoutes);

// Mount M2 API routes
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/claims', claimRoutes);

// Mount M3 API routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/visitors', visitorRoutes);

// Mount M4 API routes
app.use('/api/complaints', complaintRoutes);

// Mount M5 API routes
app.use('/api/events', eventRoutes);

// Mount File Storage API (MongoDB GridFS / Buffer File storage)
app.use('/api/files', fileRoutes);

// Mount Shared / Dashboard / Search routes
app.use('/api', dashboardRoutes);

// Initialize Cron Jobs (disabled during unit/integration tests)
if (process.env.NODE_ENV !== 'test') {
  initSlaCron();
  initEventReminderCron();
}

// In production or whenever client/dist is built, serve React app
const clientDist = path.join(__dirname, '../client/dist');
const hasClientDist = fs.existsSync(clientDist);

if (process.env.NODE_ENV === 'production' || hasClientDist) {
  app.use(express.static(clientDist));

  // Catch-all route that returns index.html for any GET request that does not start with /api
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/socket.io') ||
      req.path.startsWith('/uploads')
    ) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Helpful development guidance when client is not yet built
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Smart Campus API is running in development mode.',
      hint: 'Run "npm run build" to compile the React client or open http://localhost:5173 for the Vite dev server.',
      healthCheck: '/api/health',
    });
  });
}

// 404 & Central Error Handlers
app.use(notFound);
app.use(errorHandler);

// Export app and server
export { app, server };

// Start listening if run directly
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Smart Campus Server] Running on http://localhost:${PORT}`);
  });
}
