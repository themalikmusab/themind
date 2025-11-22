import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
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
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Initialize session manager
const sessionManager = new AttendanceSessionManager(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TheMind Attendance System is running!' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Teacher starts attendance session
  socket.on('start-session', async (data) => {
    try {
      const { classId, teacherId } = data;
      const session = await sessionManager.startSession(classId, teacherId);
      socket.join(`session-${session.id}`);
      socket.emit('session-started', session);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Teacher stops attendance session
  socket.on('stop-session', async (data) => {
    try {
      const { sessionId } = data;
      await sessionManager.stopSession(sessionId);
      io.to(`session-${sessionId}`).emit('session-stopped', { sessionId });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Student scans code
  socket.on('scan-code', async (data) => {
    try {
      const { sessionId, studentId, scannedData, timestamp } = data;
      const result = await sessionManager.markAttendance(sessionId, studentId, scannedData, timestamp);
      socket.emit('scan-result', result);
    } catch (error) {
      socket.emit('scan-error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
});
