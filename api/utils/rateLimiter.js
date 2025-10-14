/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks on the API
 */

import { RateLimitError } from './errorHandler.js';

// In-memory store for rate limiting (use Redis in production for multi-instance)
const rateLimitStore = new Map();

/**
 * Clean up old entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.resetTime > 0) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter factory
 * @param {Object} options - Rate limit configuration
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.message - Error message
 */
export function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => {
      // Use IP address or user ID as key
      return req.user?.id || req.headers['x-forwarded-for'] || req.ip || 'anonymous';
    }
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();
      
      // Get or create rate limit entry
      let rateLimitEntry = rateLimitStore.get(key);
      
      if (!rateLimitEntry || now > rateLimitEntry.resetTime) {
        // Create new entry or reset expired one
        rateLimitEntry = {
          count: 0,
          resetTime: now + windowMs,
          firstRequest: now
        };
        rateLimitStore.set(key, rateLimitEntry);
      }
      
      // Increment request count
      rateLimitEntry.count++;
      
      // Set rate limit headers
      const remaining = Math.max(0, maxRequests - rateLimitEntry.count);
      const resetTime = Math.ceil(rateLimitEntry.resetTime / 1000);
      
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);
      
      // Check if limit exceeded
      if (rateLimitEntry.count > maxRequests) {
        const retryAfter = Math.ceil((rateLimitEntry.resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        throw new RateLimitError(message);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Predefined rate limiters for different endpoints
 */

// Strict rate limiting for authentication endpoints
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later'
});

// Standard rate limiting for general API endpoints
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please slow down'
});

// Relaxed rate limiting for read-only endpoints
export const readLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 300, // 300 requests per 15 minutes
  message: 'Too many requests, please slow down'
});

// Strict rate limiting for sensitive operations (PHI access)
export const phiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  message: 'Too many PHI access requests, please slow down'
});

/**
 * Get rate limit stats (for monitoring)
 */
export function getRateLimitStats() {
  const stats = {
    totalKeys: rateLimitStore.size,
    entries: []
  };
  
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    stats.entries.push({
      key: key.substring(0, 10) + '...', // Truncate for privacy
      count: value.count,
      remaining: Math.max(0, 100 - value.count),
      resetIn: Math.max(0, Math.ceil((value.resetTime - now) / 1000))
    });
  }
  
  return stats;
}

