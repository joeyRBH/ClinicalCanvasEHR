/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses across all API endpoints
 */

export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (error, req, res) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let isOperational = error.isOperational || false;

  // Log error for debugging (in production, send to logging service)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    });
  }

  // Handle specific error types
  if (error.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (error.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  } else if (error.code === '22P02') { // PostgreSQL invalid input
    statusCode = 400;
    message = 'Invalid input format';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  // Don't expose internal errors in production
  if (!isOperational && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      timestamp: error.timestamp || new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

export const asyncHandler = (fn) => {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  };
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      statusCode: 404,
      path: req.url,
      method: req.method
    }
  });
};

