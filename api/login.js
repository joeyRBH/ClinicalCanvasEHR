import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

// Simple rate limiter (in-memory, per-function instance)
const loginAttempts = new Map();

function checkRateLimit(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || [];
  
  // Clean old attempts (older than 15 minutes)
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
  
  if (recentAttempts.length >= 5) {
    return false; // Rate limited
  }
  
  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);
  return true;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }
    });
  }

  try {
    const { username, password } = req.body;
    
    // Basic input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username and password are required', code: 'VALIDATION_ERROR' }
      });
    }
    
    if (username.length < 3 || password.length < 3) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid credentials format', code: 'VALIDATION_ERROR' }
      });
    }
    
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        success: false,
        error: { message: 'Too many login attempts. Please try again later.', code: 'RATE_LIMIT' }
      });
    }
    
    // Find user
    const users = await sql`
      SELECT id, username, password_hash, name, email, active 
      FROM users 
      WHERE username = ${username.trim()}
    `;
    
    if (users.length === 0 || !users[0].active) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials', code: 'AUTHENTICATION_ERROR' }
      });
    }
    
    const user = users[0];
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials', code: 'AUTHENTICATION_ERROR' }
      });
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, username: user.username, type: 'access' },
      JWT_SECRET,
      { expiresIn: '24h' } // Extended for better UX
    );
    
    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, type: 'refresh' },
      JWT_SECRET + '_refresh',
      { expiresIn: '7d' }
    );
    
    // Log audit (non-blocking, fail silently)
    try {
      await sql`
        INSERT INTO audit_log (
          user_id, username, event_type, resource, action,
          ip_address, user_agent, success, timestamp
        ) VALUES (
          ${user.id}, ${user.username}, 'LOGIN', 'auth', 'POST',
          ${clientIP}, ${req.headers['user-agent'] || 'unknown'}, true, NOW()
        )
      `.catch(() => {});
    } catch (e) {
      // Audit logging failed, but don't block login
      console.error('Audit log failed:', e.message);
    }
    
    // Success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        token: accessToken, // Backward compatibility
        expiresIn: 86400, // 24 hours in seconds
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Don't expose internal errors in production
    const isDev = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
      success: false,
      error: {
        message: isDev ? error.message : 'An error occurred during login',
        code: 'INTERNAL_ERROR',
        ...(isDev && { stack: error.stack })
      }
    });
  }
}
