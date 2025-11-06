// Client Portal Authentication API
// Handles client login, logout, and session management

const { initDatabase, executeQuery } = require('./utils/database-connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    // POST: Login
    if (req.method === 'POST' && req.url.includes('/login')) {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      // Get client user
      const userResult = await executeQuery(
        `SELECT cu.*, c.name, c.phone, c.date_of_birth, c.status
         FROM client_users cu
         JOIN clients c ON cu.client_id = c.id
         WHERE cu.email = $1`,
        [email.toLowerCase()]
      );

      if (userResult.data.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const user = userResult.data[0];

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return res.status(423).json({
          success: false,
          error: 'Account is temporarily locked. Please try again later.'
        });
      }

      // Check if account is active
      if (!user.is_active || user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Account is inactive. Please contact support.'
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        // Increment failed login attempts
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        const lockedUntil = failedAttempts >= 5
          ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
          : null;

        await executeQuery(
          `UPDATE client_users
           SET failed_login_attempts = $1, locked_until = $2
           WHERE id = $3`,
          [failedAttempts, lockedUntil, user.id]
        );

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          attemptsRemaining: Math.max(0, 5 - failedAttempts)
        });
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + SESSION_DURATION);

      // Get IP and user agent
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Create session
      await executeQuery(
        `INSERT INTO client_sessions
         (client_user_id, session_token, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, sessionToken, ipAddress, userAgent, expiresAt]
      );

      // Update user login info
      await executeQuery(
        `UPDATE client_users
         SET last_login = CURRENT_TIMESTAMP,
             last_login_ip = $1,
             failed_login_attempts = 0,
             locked_until = NULL
         WHERE id = $2`,
        [ipAddress, user.id]
      );

      // Log audit event
      await executeQuery(
        `INSERT INTO audit_log (user_id, user_type, action, entity_type, entity_id, ip_address, user_agent)
         VALUES ($1, 'client', 'login', 'client_user', $2, $3, $4)`,
        [user.client_id, user.id, ipAddress, userAgent]
      );

      // Generate JWT token
      const jwtToken = jwt.sign(
        {
          clientUserId: user.id,
          clientId: user.client_id,
          email: user.email
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token: jwtToken,
          sessionToken: sessionToken,
          expiresAt: expiresAt,
          user: {
            id: user.id,
            clientId: user.client_id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            dateOfBirth: user.date_of_birth
          }
        }
      });
    }

    // POST: Logout
    if (req.method === 'POST' && req.url.includes('/logout')) {
      const authHeader = req.headers.authorization;
      const sessionToken = req.body.sessionToken;

      if (!authHeader && !sessionToken) {
        return res.status(401).json({
          success: false,
          error: 'No authentication token provided'
        });
      }

      // Invalidate session
      if (sessionToken) {
        await executeQuery(
          `UPDATE client_sessions
           SET is_active = false
           WHERE session_token = $1`,
          [sessionToken]
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    // POST: Verify session
    if (req.method === 'POST' && req.url.includes('/verify')) {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(401).json({
          success: false,
          error: 'Session token required'
        });
      }

      const sessionResult = await executeQuery(
        `SELECT cs.*, cu.email, cu.is_active, cu.client_id, c.name, c.status
         FROM client_sessions cs
         JOIN client_users cu ON cs.client_user_id = cu.id
         JOIN clients c ON cu.client_id = c.id
         WHERE cs.session_token = $1
           AND cs.is_active = true
           AND cs.expires_at > CURRENT_TIMESTAMP`,
        [sessionToken]
      );

      if (sessionResult.data.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session'
        });
      }

      const session = sessionResult.data[0];

      // Update last activity
      await executeQuery(
        `UPDATE client_sessions
         SET last_activity = CURRENT_TIMESTAMP
         WHERE session_token = $1`,
        [sessionToken]
      );

      return res.status(200).json({
        success: true,
        message: 'Session valid',
        data: {
          clientId: session.client_id,
          email: session.email,
          name: session.name
        }
      });
    }

    // Invalid endpoint
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });

  } catch (error) {
    console.error('Client auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
