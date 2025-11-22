/**
 * Authentication & Authorization Middleware
 * ClinicalCanvas EHR - HIPAA Compliant
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

function generateAccessToken(payload) {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(payload) {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

function generateTokens(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'provider'
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: 3600
  };
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      return { valid: false, error: 'Invalid token type' };
    }
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      return { valid: false, error: 'Invalid token type' };
    }
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}

function getClientInfo(req) {
  return {
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };
}

async function authenticate(req, res) {
  const token = extractToken(req);
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
    return { authenticated: false };
  }

  const result = verifyAccessToken(token);
  
  if (!result.valid) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
    return { authenticated: false };
  }

  req.user = result.decoded;
  req.clientInfo = getClientInfo(req);

  return { 
    authenticated: true, 
    user: result.decoded,
    clientInfo: req.clientInfo
  };
}

async function optionalAuth(req, res) {
  const token = extractToken(req);
  
  if (!token) {
    return { authenticated: false, user: null };
  }

  const result = verifyAccessToken(token);
  
  if (!result.valid) {
    return { authenticated: false, user: null };
  }

  req.user = result.decoded;
  req.clientInfo = getClientInfo(req);

  return { 
    authenticated: true, 
    user: result.decoded,
    clientInfo: req.clientInfo
  };
}

function authorize(allowedRoles) {
  return (req, res) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
      return { authorized: false };
    }

    const userRole = req.user.role || 'provider';
    
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
      return { authorized: false };
    }

    return { authorized: true };
  };
}

async function refreshAccessToken(refreshToken) {
  const result = verifyRefreshToken(refreshToken);
  
  if (!result.valid) {
    return { success: false, error: result.error };
  }

  const { userId, email, role } = result.decoded;
  const newAccessToken = generateAccessToken({ userId, email, role });

  return {
    success: true,
    accessToken: newAccessToken,
    expiresIn: 3600
  };
}

module.exports = {
  generateTokens,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticate,
  optionalAuth,
  authorize,
  refreshAccessToken,
  extractToken,
  getClientInfo
};
