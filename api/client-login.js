// Client Portal Login API
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

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    await initDatabase();

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

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = userResult.data[0];

    // Check if account is locked (handle both camelCase and snake_case)
    const lockedUntil = user.lockedUntil || user.locked_until;
    if (lockedUntil && new Date(lockedUntil) > new Date()) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Check if account is active (handle both camelCase and snake_case)
    const isActive = user.isActive ?? user.is_active;
    const status = user.status;

    if (isActive === false || status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password (handle both camelCase and snake_case)
    const passwordHash = user.passwordHash || user.password_hash;
    const validPassword = await bcrypt.compare(password, passwordHash);

    if (!validPassword) {
      // Increment failed login attempts (handle both camelCase and snake_case)
      const currentFailedAttempts = user.failedLoginAttempts ?? user.failed_login_attempts ?? 0;
      const failedAttempts = currentFailedAttempts + 1;
      const newLockedUntil = failedAttempts >= 5
        ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
        : null;

      await executeQuery(
        `UPDATE client_users
         SET failed_login_attempts = $1, locked_until = $2
         WHERE id = $3`,
        [failedAttempts, newLockedUntil, user.id]
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
    const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

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

    // Handle both camelCase and snake_case for remaining fields
    const clientId = user.clientId || user.client_id;
    const dateOfBirth = user.dateOfBirth || user.date_of_birth;

    // Log audit event
    await executeQuery(
      `INSERT INTO audit_log (user_id, user_type, action, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1, 'client', 'login', 'client_user', $2, $3, $4)`,
      [clientId, user.id, ipAddress, userAgent]
    );

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        clientUserId: user.id,
        clientId: clientId,
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
          clientId: clientId,
          email: user.email,
          name: user.name,
          phone: user.phone,
          dateOfBirth: dateOfBirth
        }
      }
    });

  } catch (error) {
    console.error('Client login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
