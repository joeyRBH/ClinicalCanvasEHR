/**
 * Authentication Middleware
 * JWT-based authentication with refresh token support
 */

import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
const ACCESS_TOKEN_EXPIRY = '1h'; // Access token expires in 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // Refresh token expires in 7 days

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Generate access token
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    expiresIn: 3600 // 1 hour in seconds
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token expired');
    }
    throw new AuthenticationError('Invalid token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token expired');
    }
    throw new AuthenticationError('Invalid refresh token');
  }
}

/**
 * Extract token from request header
 */
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AuthenticationError('Invalid authorization header format');
  }
  
  return parts[1];
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AuthenticationError('Authentication token required');
    }
    
    const decoded = verifyAccessToken(token);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export function optionalAuthenticate(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        username: decoded.username
      };
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Role-based authorization middleware
 * Note: Currently all authenticated users are clinicians
 * This is set up for future multi-role support
 */
export function authorize(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      // Future: Check user role against allowed roles
      // For now, all authenticated users have access
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Get client IP address for logging
 */
export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Get user agent for logging
 */
export function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

