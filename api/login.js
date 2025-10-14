import bcrypt from 'bcryptjs';
import { sql } from './utils/database.js';
import { asyncHandler, AuthenticationError, successResponse } from './utils/errorHandler.js';
import { validateCredentials } from './utils/validator.js';
import { generateTokenPair } from './utils/auth.js';
import { logAuditEvent, AuditEventType } from './utils/auditLogger.js';
import { getClientIP, getUserAgent } from './utils/auth.js';
import { authLimiter } from './utils/rateLimiter.js';

export default asyncHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    authLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Validate input
  const { username, password } = validateCredentials(req.body.username, req.body.password);
  
  // Find user
  const users = await sql`
    SELECT id, username, password_hash, name, email, active 
    FROM users 
    WHERE username = ${username}
  `;
  
  // Log failed login attempt
  if (users.length === 0 || !users[0].active) {
    await logAuditEvent({
      username,
      eventType: AuditEventType.LOGIN_FAILED,
      resource: 'auth',
      action: 'POST',
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      success: false,
      errorMessage: 'Invalid credentials'
    });
    throw new AuthenticationError('Invalid credentials');
  }
  
  const user = users[0];
  
  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  
  if (!valid) {
    await logAuditEvent({
      userId: user.id,
      username: user.username,
      eventType: AuditEventType.LOGIN_FAILED,
      resource: 'auth',
      action: 'POST',
      ipAddress: getClientIP(req),
      userAgent: getUserAgent(req),
      success: false,
      errorMessage: 'Invalid password'
    });
    throw new AuthenticationError('Invalid credentials');
  }
  
  // Generate tokens
  const tokens = generateTokenPair(user);
  
  // Log successful login
  await logAuditEvent({
    userId: user.id,
    username: user.username,
    eventType: AuditEventType.LOGIN,
    resource: 'auth',
    action: 'POST',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
    success: true
  });
  
  successResponse(res, {
    ...tokens,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email
    }
  }, 'Login successful');
});
