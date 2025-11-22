import express from 'express';
import db from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get attendance records for a class
 */
router.get('/class/:classId', authMiddleware, (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    // Verify access
    if (role === 'teacher') {
      const classData = db.prepare('SELECT teacher_id FROM classes WHERE id = ?').get(classId);
      if (!classData || classData.teacher_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      const enrollment = db.prepare(`
        SELECT id FROM enrollments WHERE class_id = ? AND student_id = ?
      `).get(classId, userId);

      if (!enrollment) {
        return res.status(403).json({ error: 'Not enrolled in this class' });
      }
    }

    // Get attendance sessions
    const sessions = db.prepare(`
      SELECT
        s.id,
        s.started_at,
        s.ended_at,
        s.is_active,
        COUNT(r.id) as attendance_count
      FROM attendance_sessions s
      LEFT JOIN attendance_records r ON s.id = r.session_id
      WHERE s.class_id = ?
      GROUP BY s.id
      ORDER BY s.started_at DESC
      LIMIT 50
    `).all(classId);

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

/**
 * Get detailed attendance for a session
 */
router.get('/session/:sessionId', authMiddleware, (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get session
    const session = db.prepare(`
      SELECT s.*, c.name as class_name
      FROM attendance_sessions s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `).get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get attendance records
    const records = db.prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        r.marked_at
      FROM attendance_records r
      JOIN users u ON r.student_id = u.id
      WHERE r.session_id = ?
      ORDER BY r.marked_at
    `).all(sessionId);

    res.json({
      session,
      records
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

/**
 * Get attendance report for a class (CSV export data)
 */
router.get('/report/:classId', authMiddleware, (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.userId;

    // Verify teacher access
    const classData = db.prepare('SELECT teacher_id, name FROM classes WHERE id = ?')
      .get(classId);

    if (!classData || classData.teacher_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all students
    const students = db.prepare(`
      SELECT u.id, u.name, u.email
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.class_id = ?
      ORDER BY u.name
    `).all(classId);

    // Get all sessions
    const sessions = db.prepare(`
      SELECT id, started_at, ended_at
      FROM attendance_sessions
      WHERE class_id = ?
      ORDER BY started_at
    `).all(classId);

    // Get all attendance records
    const records = db.prepare(`
      SELECT r.student_id, r.session_id
      FROM attendance_records r
      JOIN attendance_sessions s ON r.session_id = s.id
      WHERE s.class_id = ?
    `).all(classId);

    // Build attendance matrix
    const attendanceMap = {};
    records.forEach(record => {
      const key = `${record.student_id}-${record.session_id}`;
      attendanceMap[key] = true;
    });

    // Format report data
    const reportData = students.map(student => {
      const attendance = sessions.map(session => {
        const key = `${student.id}-${session.id}`;
        return attendanceMap[key] ? 'Present' : 'Absent';
      });

      const presentCount = attendance.filter(a => a === 'Present').length;
      const percentage = sessions.length > 0
        ? ((presentCount / sessions.length) * 100).toFixed(1)
        : 0;

      return {
        name: student.name,
        email: student.email,
        attendance,
        presentCount,
        totalSessions: sessions.length,
        percentage
      };
    });

    res.json({
      className: classData.name,
      sessions: sessions.map(s => ({
        id: s.id,
        date: new Date(s.started_at).toLocaleDateString()
      })),
      students: reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Get student's own attendance for a class
 */
router.get('/my-attendance/:classId', authMiddleware, (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user.userId;

    // Verify enrollment
    const enrollment = db.prepare(`
      SELECT id FROM enrollments WHERE class_id = ? AND student_id = ?
    `).get(classId, studentId);

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this class' });
    }

    // Get attendance records
    const records = db.prepare(`
      SELECT
        s.started_at,
        r.marked_at,
        CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END as present
      FROM attendance_sessions s
      LEFT JOIN attendance_records r ON s.id = r.session_id AND r.student_id = ?
      WHERE s.class_id = ?
      ORDER BY s.started_at DESC
      LIMIT 30
    `).all(studentId, classId);

    // Get streak
    const streak = db.prepare(`
      SELECT current_streak, max_streak
      FROM streaks
      WHERE student_id = ? AND class_id = ?
    `).get(studentId, classId);

    // Calculate stats
    const totalSessions = records.length;
    const presentCount = records.filter(r => r.present).length;
    const percentage = totalSessions > 0
      ? ((presentCount / totalSessions) * 100).toFixed(1)
      : 0;

    res.json({
      records,
      stats: {
        totalSessions,
        presentCount,
        percentage,
        currentStreak: streak?.current_streak || 0,
        maxStreak: streak?.max_streak || 0
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

export default router;
