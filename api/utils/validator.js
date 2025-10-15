/**
 * Input Validation and Sanitization
 * HIPAA-compliant data validation for all API inputs
 */

import { ValidationError } from './errorHandler.js';

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .substring(0, 10000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate phone number (US format)
 */
export function isValidPhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
  return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 20;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

/**
 * Validate time format (HH:MM or HH:MM:SS)
 */
export function isValidTime(timeString) {
  if (!timeString) return false;
  return timeString.match(/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid) {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate integer ID
 */
export function isValidId(id) {
  const num = parseInt(id);
  return !isNaN(num) && num > 0 && num <= 2147483647; // PostgreSQL INT max
}

/**
 * Validate client data
 */
export function validateClientData(data) {
  const errors = [];

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (data.name && data.name.length > 255) {
    errors.push('Name must be less than 255 characters');
  }

  // Email validation (optional but must be valid if provided)
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  // Phone validation
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  // Date of birth validation
  if (data.dob) {
    if (!isValidDate(data.dob)) {
      errors.push('Invalid date format for date of birth (use YYYY-MM-DD)');
    } else {
      const dob = new Date(data.dob);
      const today = new Date();
      const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 0 || age > 150) {
        errors.push('Date of birth must be realistic');
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Client validation failed', errors);
  }

  // Sanitize data
  return {
    name: sanitizeString(data.name),
    email: data.email ? sanitizeString(data.email.toLowerCase()) : null,
    phone: data.phone ? sanitizeString(data.phone) : null,
    dob: data.dob || null,
    notes: data.notes ? sanitizeString(data.notes) : null
  };
}

/**
 * Validate appointment data
 */
export function validateAppointmentData(data) {
  const errors = [];

  // Client ID validation
  if (!data.client_id || !isValidId(data.client_id)) {
    errors.push('Valid client ID is required');
  }

  // Date validation
  if (!data.appointment_date || !isValidDate(data.appointment_date)) {
    errors.push('Valid appointment date is required (YYYY-MM-DD)');
  } else {
    const aptDate = new Date(data.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    
    if (aptDate < today) {
      errors.push('Appointment date cannot be in the past');
    }
    if (aptDate > maxDate) {
      errors.push('Appointment date cannot be more than 2 years in the future');
    }
  }

  // Time validation
  if (!data.appointment_time || !isValidTime(data.appointment_time)) {
    errors.push('Valid appointment time is required (HH:MM)');
  }

  // Duration validation
  if (data.duration) {
    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration < 15 || duration > 480) {
      errors.push('Duration must be between 15 and 480 minutes');
    }
  }

  // Type validation
  if (!data.type || data.type.trim().length < 3) {
    errors.push('Appointment type is required');
  }

  if (errors.length > 0) {
    throw new ValidationError('Appointment validation failed', errors);
  }

  return {
    client_id: parseInt(data.client_id),
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    duration: data.duration ? parseInt(data.duration) : 60,
    type: sanitizeString(data.type),
    cpt_code: data.cpt_code ? sanitizeString(data.cpt_code) : null,
    notes: data.notes ? sanitizeString(data.notes) : null,
    status: data.status ? sanitizeString(data.status) : 'scheduled'
  };
}

/**
 * Validate invoice data
 */
export function validateInvoiceData(data) {
  const errors = [];

  if (!data.client_id || !isValidId(data.client_id)) {
    errors.push('Valid client ID is required');
  }

  if (!data.services || !Array.isArray(data.services) || data.services.length === 0) {
    errors.push('At least one service is required');
  }

  if (!data.total_amount || isNaN(parseFloat(data.total_amount)) || parseFloat(data.total_amount) <= 0) {
    errors.push('Valid total amount is required');
  }

  if (data.due_date && !isValidDate(data.due_date)) {
    errors.push('Invalid due date format');
  }

  if (errors.length > 0) {
    throw new ValidationError('Invoice validation failed', errors);
  }

  return {
    client_id: parseInt(data.client_id),
    services: data.services,
    total_amount: parseFloat(data.total_amount),
    due_date: data.due_date || null,
    notes: data.notes ? sanitizeString(data.notes) : null
  };
}

/**
 * Validate credentials
 */
export function validateCredentials(username, password) {
  const errors = [];

  if (!username || username.length < 3 || username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  // Check for SQL injection patterns
  const sqlPatterns = /['";\\]|(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i;
  if (sqlPatterns.test(username)) {
    errors.push('Invalid username format');
  }

  if (errors.length > 0) {
    throw new ValidationError('Credential validation failed', errors);
  }

  return {
    username: sanitizeString(username),
    password: password // Don't sanitize password, let bcrypt handle it
  };
}

/**
 * Middleware to validate request body
 */
export function validateRequest(validatorFn) {
  return (req, res, next) => {
    try {
      req.validatedData = validatorFn(req.body);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            timestamp: error.timestamp
          }
        });
      } else {
        next(error);
      }
    }
  };
}



