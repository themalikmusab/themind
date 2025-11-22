import express from 'express';
import db from '../database/init.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate random 6-character join code
 */
function generateJoinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new class (teachers only)
 */
router.post('/create', authMiddleware, (req, res) => {
  try {
    const { name } = req.body;
    const teacherId = req.user.userId;

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create classes' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    // Generate unique join code
    let joinCode;
    let attempts = 0;
    do {
      joinCode = generateJoinCode();
      const existing = db.prepare('SELECT id FROM classes WHERE join_code = ?').get(joinCode);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    // Create class
    const stmt = db.prepare(`
      INSERT INTO classes (name, join_code, teacher_id)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name, joinCode, teacherId);

    res.json({
      success: true,
      class: {
        id: result.lastInsertRowid,
        name,
        joinCode
      }
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

/**
 * Join a class (students only)
 */
router.post('/join', authMiddleware, (req, res) => {
  try {
    const { joinCode } = req.body;
    const studentId = req.user.userId;

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can join classes' });
    }

    if (!joinCode) {
      return res.status(400).json({ error: 'Join code is required' });
    }

    // Find class
    const classData = db.prepare('SELECT * FROM classes WHERE join_code = ?')
      .get(joinCode.toUpperCase());

    if (!classData) {
      return res.status(404).json({ error: 'Invalid join code' });
    }

    // Check if already enrolled
    const existing = db.prepare(`
      SELECT id FROM enrollments WHERE class_id = ? AND student_id = ?
    `).get(classData.id, studentId);

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this class' });
    }

    // Enroll student
    const stmt = db.prepare(`
      INSERT INTO enrollments (class_id, student_id)
      VALUES (?, ?)
    `);

    stmt.run(classData.id, studentId);

    res.json({
      success: true,
      class: {
        id: classData.id,
        name: classData.name
      }
    });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

/**
 * Get all classes for current user
 */
router.get('/my-classes', authMiddleware, (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let classes;

    if (role === 'teacher') {
      // Get classes taught by this teacher
      classes = db.prepare(`
        SELECT
          c.*,
          COUNT(DISTINCT e.student_id) as student_count
        FROM classes c
        LEFT JOIN enrollments e ON c.id = e.class_id
        WHERE c.teacher_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `).all(userId);
    } else {
      // Get classes student is enrolled in
      classes = db.prepare(`
        SELECT
          c.*,
          u.name as teacher_name,
          s.current_streak,
          s.max_streak
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        JOIN users u ON c.teacher_id = u.id
        LEFT JOIN streaks s ON s.class_id = c.id AND s.student_id = ?
        WHERE e.student_id = ?
        ORDER BY e.enrolled_at DESC
      `).all(userId, userId);
    }

    res.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

/**
 * Get class details
 */
router.get('/:classId', authMiddleware, (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    // Get class
    const classData = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Verify access
    if (role === 'teacher' && classData.teacher_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (role === 'student') {
      const enrollment = db.prepare(`
        SELECT id FROM enrollments WHERE class_id = ? AND student_id = ?
      `).get(classId, userId);

      if (!enrollment) {
        return res.status(403).json({ error: 'Not enrolled in this class' });
      }
    }

    // Get students if teacher
    let students = [];
    if (role === 'teacher') {
      students = db.prepare(`
        SELECT
          u.id,
          u.name,
          u.email,
          s.current_streak,
          s.max_streak
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        LEFT JOIN streaks s ON s.student_id = u.id AND s.class_id = ?
        WHERE e.class_id = ?
        ORDER BY u.name
      `).all(classId, classId);
    }

    res.json({
      class: classData,
      students
    });
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({ error: 'Failed to fetch class details' });
  }
});

export default router;
