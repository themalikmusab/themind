import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/classes.js';
import attendanceRoutes from './routes/attendance.js';
import { initDatabase } from './database/init.js';
import { AttendanceSessionManager } from './services/sessionManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6 // 1MB
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Socket.IO compatibility
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit login attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Initialize database
initDatabase();

// Initialize session manager
const sessionManager = new AttendanceSessionManager(io);

// Make session manager available to routes
app.set('sessionManager', sessionManager);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TheMind Attendance System is running!',
    activeSessions: sessionManager.getActiveSessionsCount(),
    uptime: process.uptime()
  });
});

// Get active sessions for a class (for student scanning)
app.get('/api/sessions/active/:classId', (req, res) => {
  try {
    const { classId } = req.params;
    const activeSession = sessionManager.getActiveSessionForClass(parseInt(classId));

    if (activeSession) {
      res.json({
        success: true,
        session: {
          id: activeSession.id,
          classId: activeSession.classId,
          isActive: true
        }
      });
    } else {
      res.json({
        success: false,
        message: 'No active session for this class'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Teacher starts attendance session
  socket.on('start-session', async (data) => {
    try {
      const { classId, teacherId } = data;

      if (!classId || !teacherId) {
        throw new Error('Missing required data');
      }

      const session = await sessionManager.startSession(classId, teacherId);
      socket.join(`session-${session.id}`);
      socket.join(`class-${classId}`);

      // Emit to all students in this class that a session has started
      io.to(`class-${classId}`).emit('session-available', {
        sessionId: session.id,
        classId
      });

      socket.emit('session-started', session);
      console.log(`✅ Session ${session.id} started for class ${classId}`);
    } catch (error) {
      console.error('Error starting session:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Teacher stops attendance session
  socket.on('stop-session', async (data) => {
    try {
      const { sessionId } = data;

      if (!sessionId) {
        throw new Error('Session ID required');
      }

      const result = await sessionManager.stopSession(sessionId);
      io.to(`session-${sessionId}`).emit('session-stopped', { sessionId });

      console.log(`🛑 Session ${sessionId} stopped`);
      socket.emit('session-stopped-confirmed', result);
    } catch (error) {
      console.error('Error stopping session:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Student joins class room (for real-time updates)
  socket.on('join-class', (data) => {
    const { classId } = data;
    socket.join(`class-${classId}`);
    console.log(`Student joined class room: ${classId}`);
  });

  // Student scans code
  socket.on('scan-code', async (data) => {
    try {
      const { classId, studentId, scannedData, timestamp } = data;

      if (!classId || !studentId || !scannedData) {
        throw new Error('Missing required scan data');
      }

      // Find active session for this class
      const activeSession = sessionManager.getActiveSessionForClass(classId);

      if (!activeSession) {
        socket.emit('scan-error', {
          message: 'No active attendance session for this class'
        });
        return;
      }

      const result = await sessionManager.markAttendance(
        activeSession.id,
        studentId,
        scannedData,
        timestamp
      );

      socket.emit('scan-result', result);

      // Notify teacher of new attendance
      if (result.success) {
        io.to(`session-${activeSession.id}`).emit('attendance-marked', {
          studentId,
          timestamp: Date.now()
        });
      }

      console.log(`Scan result for student ${studentId}:`, result.success ? '✅' : '❌');
    } catch (error) {
      console.error('Error processing scan:', error);
      socket.emit('scan-error', { message: error.message });
    }
  });

  // Get real-time attendance count
  socket.on('get-attendance-count', async (data) => {
    try {
      const { sessionId } = data;
      const count = await sessionManager.getAttendanceCount(sessionId);
      socket.emit('attendance-count', { sessionId, count });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
  console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
  console.log(`⚡ Compression enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
