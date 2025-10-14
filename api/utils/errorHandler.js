/**
 * Centralized Error Handling for ClinicalSpeak EHR
 * HIPAA-compliant error responses that don't leak sensitive information
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Global error handler for API endpoints
 */
export function handleError(error, req, res) {
  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details || null;

  // Handle database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
  } else if (error.code === '23503') { // Foreign key violation
    statusCode = 400;
    code = 'INVALID_REFERENCE';
    message = 'Referenced resource does not exist';
  } else if (error.code === '22P02') { // Invalid input syntax
    statusCode = 400;
    code = 'INVALID_INPUT';
    message = 'Invalid data format';
  } else if (error.code === '23502') { // Not null violation
    statusCode = 400;
    code = 'MISSING_REQUIRED_FIELD';
    message = 'Required field is missing';
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error details (but don't expose to client in production)
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (statusCode >= 500) {
    console.error('Server Error:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode,
      message: error.message,
      stack: error.stack,
      user: req.user?.username || 'anonymous'
    });
  }

  // HIPAA Compliance: Don't leak internal errors in production
  if (!error.isOperational && !isDevelopment) {
    message = 'An unexpected error occurred. Please contact support.';
    details = null;
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode,
      timestamp: error.timestamp || new Date().toISOString(),
      ...(details && { details }),
      ...(isDevelopment && { stack: error.stack })
    }
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch errors automatically
 */
export function asyncHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      handleError(error, req, res);
    }
  };
}

/**
 * Success response helper
 */
export function successResponse(res, data, message = 'Success', statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

