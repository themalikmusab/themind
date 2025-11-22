import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'themind-jwt-secret-change-in-production';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
