/**
 * Security Headers and CORS Configuration
 * HIPAA-compliant security measures
 */

/**
 * CORS Configuration
 */
export function configureCORS(req, res) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173']; // Default for development
  
  const origin = req.headers.origin;
  
  // In production, strictly check allowed origins
  if (process.env.NODE_ENV === 'production') {
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    // In development, allow all origins
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // Indicates preflight was handled
  }
  
  return false;
}

/**
 * Security Headers Middleware
 * Implements security best practices
 */
export function securityHeaders(req, res, next) {
  // Handle CORS
  if (configureCORS(req, res)) {
    return; // Preflight request handled
  }
  
  // Strict-Transport-Security: Enforce HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // X-Content-Type-Options: Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options: Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection: Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy: Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content-Security-Policy: Prevent XSS and injection attacks
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // Permissions-Policy: Control browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // X-Powered-By: Remove server information
  res.removeHeader('X-Powered-By');
  
  // Cache-Control: Prevent caching of sensitive data
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
}

/**
 * Request logging middleware (for security monitoring)
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.url,
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    user: req.user?.username || 'anonymous'
  };
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logEntry = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', logEntry);
    }
    
    // In production, send to logging service
    // Example: sendToLogService(logEntry);
  });
  
  next();
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeLog(data) {
  const sensitiveFields = ['password', 'token', 'ssn', 'creditCard'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Check if request is from a trusted source
 */
export function isTrustedSource(req) {
  // Check for internal API key (if configured)
  const apiKey = req.headers['x-api-key'];
  const trustedApiKey = process.env.INTERNAL_API_KEY;
  
  if (trustedApiKey && apiKey === trustedApiKey) {
    return true;
  }
  
  // Check for trusted IP addresses
  const trustedIPs = process.env.TRUSTED_IPS
    ? process.env.TRUSTED_IPS.split(',')
    : [];
  
  const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
  
  return trustedIPs.includes(clientIP);
}

/**
 * Body size limiter (prevent DoS attacks)
 */
export function bodySizeLimiter(maxSize = 1024 * 1024) { // Default 1MB
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || 0);
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        error: {
          message: 'Request body too large',
          code: 'PAYLOAD_TOO_LARGE',
          maxSize: `${maxSize / 1024}KB`
        }
      });
    }
    
    next();
  };
}



