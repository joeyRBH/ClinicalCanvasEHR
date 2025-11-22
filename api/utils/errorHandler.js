/**
 * Centralized Error Handler
 * Sessionably - HIPAA Compliant
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests', 429, 'RATE_LIMITED');
    this.retryAfter = retryAfter;
  }
}

const SAFE_MESSAGES = {
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
  DATABASE_ERROR: 'A database error occurred. Please try again.',
  VALIDATION_ERROR: 'Invalid input provided.',
  UNAUTHORIZED: 'Authentication required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  CONFLICT: 'This resource already exists.',
  RATE_LIMITED: 'Too many requests. Please slow down.',
  BAD_REQUEST: 'Invalid request.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable.'
};

function getSafeMessage(error) {
  if (error instanceof AppError && error.isOperational) {
    return error.message;
  }
  return SAFE_MESSAGES.INTERNAL_ERROR;
}

function formatErrorResponse(error) {
  const response = {
    success: false,
    error: getSafeMessage(error),
    code: error.code || 'INTERNAL_ERROR'
  };

  if (error instanceof ValidationError && error.details) {
    response.details = error.details;
  }

  if (error instanceof RateLimitError) {
    response.retryAfter = error.retryAfter;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return response;
}

function handleError(error, req, res) {
  console.error('[ERROR]', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    path: req?.url,
    method: req?.method
  });

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json(formatErrorResponse(error));
}

function asyncHandler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      handleError(error, req, res);
    }
  };
}

function fromDatabaseError(error) {
  if (error.code === '23505') {
    return new ConflictError('A record with this value already exists');
  }
  if (error.code === '23503') {
    return new ValidationError('Referenced record does not exist');
  }
  if (error.code === '23502') {
    return new ValidationError('Required field is missing');
  }
  
  console.error('[DATABASE ERROR]', error);
  return new AppError(SAFE_MESSAGES.DATABASE_ERROR, 500, 'DATABASE_ERROR');
}

function successResponse(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data
  });
}

function createdResponse(res, data) {
  successResponse(res, data, 201);
}

function noContentResponse(res) {
  res.status(204).end();
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  handleError,
  asyncHandler,
  fromDatabaseError,
  formatErrorResponse,
  getSafeMessage,
  successResponse,
  createdResponse,
  noContentResponse,
  SAFE_MESSAGES
};
