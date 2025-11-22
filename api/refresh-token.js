/**
 * Token Refresh Endpoint
 * Sessionably
 */

const { refreshAccessToken, verifyRefreshToken } = require('./utils/auth');
const { setupSecurity } = require('./utils/security');
const { rateLimiters } = require('./utils/rateLimiter');
const { logAuth, EVENT_TYPES } = require('./utils/auditLogger');

module.exports = async function handler(req, res) {
  const securityResult = setupSecurity(req, res);
  if (!securityResult.allowed) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const rateLimitResult = rateLimiters.auth(req, res);
  if (!rateLimitResult.allowed) return;

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        code: 'MISSING_TOKEN'
      });
    }

    const result = await refreshAccessToken(refreshToken);

    if (!result.success) {
      await logAuth(req, EVENT_TYPES.TOKEN_REFRESH, null, false, {
        error: result.error
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const tokenData = verifyRefreshToken(refreshToken);
    
    await logAuth(req, EVENT_TYPES.TOKEN_REFRESH, tokenData.decoded?.userId, true);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    console.error('[REFRESH TOKEN] Error:', error);

    await logAuth(req, EVENT_TYPES.TOKEN_REFRESH, null, false, {
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      code: 'REFRESH_ERROR'
    });
  }
};
