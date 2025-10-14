/**
 * Token Refresh Endpoint
 * Allows clients to refresh expired access tokens
 */

import { asyncHandler, AuthenticationError } from './utils/errorHandler.js';
import { verifyRefreshToken, generateAccessToken } from './utils/auth.js';
import { sql } from './utils/database.js';
import { logAuditEvent, AuditEventType } from './utils/auditLogger.js';
import { getClientIP, getUserAgent } from './utils/auth.js';

export default asyncHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AuthenticationError('Refresh token is required');
  }
  
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  
  // Verify user still exists and is active
  const users = await sql`
    SELECT id, username, name, email, active 
    FROM users 
    WHERE id = ${decoded.id}
  `;
  
  if (users.length === 0 || !users[0].active) {
    throw new AuthenticationError('User not found or inactive');
  }
  
  const user = users[0];
  
  // Generate new access token
  const accessToken = generateAccessToken(user);
  
  // Log token refresh
  await logAuditEvent({
    userId: user.id,
    username: user.username,
    eventType: AuditEventType.TOKEN_REFRESH,
    resource: 'auth',
    action: 'POST',
    ipAddress: getClientIP(req),
    userAgent: getUserAgent(req),
    success: true
  });
  
  res.json({
    success: true,
    accessToken,
    expiresIn: 3600 // 1 hour
  });
});

