import { generateScanGrid, validateScanGrid } from '../utils/scanGridEncoder.js';
import db from '../database/init.js';

/**
 * Manages attendance sessions with 6-second ScanGrid refresh
 */
export class AttendanceSessionManager {
  constructor(io) {
    this.io = io;
    this.activeSessions = new Map(); // sessionId -> interval
  }

  /**
   * Start a new attendance session
   */
  async startSession(classId, teacherId) {
    // Create session in database
    const stmt = db.prepare(`
      INSERT INTO attendance_sessions (class_id, teacher_id, is_active)
      VALUES (?, ?, 1)
    `);

    const result = stmt.run(classId, teacherId);
    const sessionId = result.lastInsertRowid;

    // Generate initial ScanGrid
    const scanGrid = generateScanGrid(sessionId);

    // Start 6-second refresh interval
    const interval = setInterval(() => {
      const newScanGrid = generateScanGrid(sessionId);
      this.io.to(`session-${sessionId}`).emit('scangrid-update', newScanGrid);
    }, 6000);

    this.activeSessions.set(sessionId, interval);

    // Auto-close after 15 minutes
    setTimeout(() => {
      this.stopSession(sessionId);
    }, 15 * 60 * 1000);

    console.log(`✅ Session ${sessionId} started for class ${classId}`);

    return {
      id: sessionId,
      classId,
      scanGrid,
      expiresIn: 6000
    };
  }

  /**
   * Stop an attendance session
   */
  async stopSession(sessionId) {
    // Clear the interval
    const interval = this.activeSessions.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.activeSessions.delete(sessionId);
    }

    // Update database
    const stmt = db.prepare(`
      UPDATE attendance_sessions
      SET is_active = 0, ended_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(sessionId);

    console.log(`🛑 Session ${sessionId} stopped`);

    return { success: true };
  }

  /**
   * Mark attendance when student scans code
   */
  async markAttendance(sessionId, studentId, scannedData, scanTimestamp) {
    try {
      // Validate the scanned ScanGrid
      const validation = validateScanGrid(scannedData);

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          message: validation.error === 'Code expired'
            ? '⏰ Code expired! Scan the new one.'
            : '❌ Invalid code. Please try again.'
        };
      }

      // Verify session matches
      if (validation.sessionId !== sessionId) {
        return {
          success: false,
          error: 'Session mismatch',
          message: '❌ Wrong class code!'
        };
      }

      // Check if session is still active
      const session = db.prepare('SELECT is_active, class_id FROM attendance_sessions WHERE id = ?')
        .get(sessionId);

      if (!session || !session.is_active) {
        return {
          success: false,
          error: 'Session inactive',
          message: '❌ Attendance is no longer active!'
        };
      }

      // Check if student already marked attendance
      const existingRecord = db.prepare(`
        SELECT id FROM attendance_records
        WHERE session_id = ? AND student_id = ?
      `).get(sessionId, studentId);

      if (existingRecord) {
        return {
          success: false,
          error: 'Already marked',
          message: '✅ You already marked attendance!'
        };
      }

      // Mark attendance
      const stmt = db.prepare(`
        INSERT INTO attendance_records (session_id, student_id)
        VALUES (?, ?)
      `);

      stmt.run(sessionId, studentId);

      // Update streak
      const streak = await this.updateStreak(studentId, session.class_id);

      console.log(`✅ Attendance marked: Student ${studentId} in session ${sessionId}`);

      return {
        success: true,
        message: `✅ Attendance Marked!`,
        streak: streak.current_streak,
        maxStreak: streak.max_streak,
        scanTime: Math.floor((Date.now() - validation.timestamp) / 1000)
      };
    } catch (error) {
      console.error('Error marking attendance:', error);
      return {
        success: false,
        error: error.message,
        message: '❌ Error marking attendance. Please try again.'
      };
    }
  }

  /**
   * Update student's attendance streak
   */
  async updateStreak(studentId, classId) {
    const today = new Date().toISOString().split('T')[0];

    // Get current streak
    let streak = db.prepare(`
      SELECT * FROM streaks
      WHERE student_id = ? AND class_id = ?
    `).get(studentId, classId);

    if (!streak) {
      // Create new streak
      const stmt = db.prepare(`
        INSERT INTO streaks (student_id, class_id, current_streak, max_streak, last_attendance_date)
        VALUES (?, ?, 1, 1, ?)
      `);
      stmt.run(studentId, classId, today);

      return { current_streak: 1, max_streak: 1 };
    }

    const lastDate = new Date(streak.last_attendance_date);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    let newStreak = streak.current_streak;
    let newMaxStreak = streak.max_streak;

    if (daysDiff === 0) {
      // Same day, no change
      return { current_streak: newStreak, max_streak: newMaxStreak };
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      newStreak += 1;
      newMaxStreak = Math.max(newStreak, newMaxStreak);
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }

    // Update streak
    const updateStmt = db.prepare(`
      UPDATE streaks
      SET current_streak = ?, max_streak = ?, last_attendance_date = ?
      WHERE student_id = ? AND class_id = ?
    `);

    updateStmt.run(newStreak, newMaxStreak, today, studentId, classId);

    return { current_streak: newStreak, max_streak: newMaxStreak };
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount() {
    return this.activeSessions.size;
  }
}
