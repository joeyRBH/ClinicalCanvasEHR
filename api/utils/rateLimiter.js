/**
 * Rate Limiting Middleware
 * Sessionably - HIPAA Compliant
 */

const rateLimitStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  phi: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: 'Rate limit exceeded. Please slow down.'
  },
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Too many requests. Please try again shortly.'
  },
  public: {
    windowMs: 60 * 1000,
    maxRequests: 200,
    message: 'Rate limit exceeded.'
  }
};

function getClientId(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             'unknown';
  const userId = req.user?.userId || '';
  return `${ip}:${userId}`;
}

function checkRateLimit(clientId, limitType = 'api') {
  const config = RATE_LIMITS[limitType] || RATE_LIMITS.api;
  const now = Date.now();
  const key = `${limitType}:${clientId}`;
  
  let data = rateLimitStore.get(key);
  
  if (!data || now > data.resetTime) {
    data = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }
  
  data.count++;
  rateLimitStore.set(key, data);
  
  const remaining = Math.max(0, config.maxRequests - data.count);
  const resetIn = Math.ceil((data.resetTime - now) / 1000);
  
  return {
    allowed: data.count <= config.maxRequests,
    remaining,
    resetIn,
    limit: config.maxRequests,
    message: config.message
  };
}

function createRateLimiter(limitType = 'api') {
  return (req, res) => {
    const clientId = getClientId(req);
    const result = checkRateLimit(clientId, limitType);
    
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetIn);
    
    if (!result.allowed) {
      res.status(429).json({
        success: false,
        error: result.message,
        code: 'RATE_LIMITED',
        retryAfter: result.resetIn
      });
      return { allowed: false };
    }
    
    return { allowed: true, remaining: result.remaining };
  };
}

const rateLimiters = {
  auth: (req, res) => createRateLimiter('auth')(req, res),
  phi: (req, res) => createRateLimiter('phi')(req, res),
  api: (req, res) => createRateLimiter('api')(req, res),
  public: (req, res) => createRateLimiter('public')(req, res)
};

function getRateLimitStatus() {
  return {
    activeClients: rateLimitStore.size,
    limits: Object.keys(RATE_LIMITS).map(type => ({
      type,
      windowMs: RATE_LIMITS[type].windowMs,
      maxRequests: RATE_LIMITS[type].maxRequests
    }))
  };
}

module.exports = {
  rateLimiters,
  createRateLimiter,
  checkRateLimit,
  getRateLimitStatus,
  RATE_LIMITS
};
