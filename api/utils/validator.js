/**
 * Input Validation & Sanitization
 * Sessionably - HIPAA Compliant
 */

function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[sanitizeString(key)] = sanitizeObject(value);
  }
  return sanitized;
}

const validators = {
  email: (value) => {
    if (!value) return { valid: false, error: 'Email is required' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true, value: value.toLowerCase().trim() };
  },

  phone: (value) => {
    if (!value) return { valid: true, value: null };
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) {
      return { valid: false, error: 'Invalid phone number' };
    }
    return { valid: true, value: cleaned };
  },

  requiredString: (value, fieldName = 'Field') => {
    if (!value || typeof value !== 'string' || !value.trim()) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true, value: sanitizeString(value.trim()) };
  },

  optionalString: (value) => {
    if (!value) return { valid: true, value: null };
    if (typeof value !== 'string') {
      return { valid: false, error: 'Must be a string' };
    }
    return { valid: true, value: sanitizeString(value.trim()) };
  },

  requiredNumber: (value, fieldName = 'Field') => {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: `${fieldName} must be a number` };
    }
    return { valid: true, value: num };
  },

  positiveNumber: (value, fieldName = 'Field') => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return { valid: false, error: `${fieldName} must be a positive number` };
    }
    return { valid: true, value: num };
  },

  requiredId: (value, fieldName = 'ID') => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      return { valid: false, error: `Invalid ${fieldName}` };
    }
    return { valid: true, value: num };
  },

  date: (value, fieldName = 'Date') => {
    if (!value) return { valid: true, value: null };
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: `Invalid ${fieldName}` };
    }
    return { valid: true, value: date.toISOString() };
  },

  requiredDate: (value, fieldName = 'Date') => {
    if (!value) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return validators.date(value, fieldName);
  },

  boolean: (value) => {
    if (value === undefined || value === null) {
      return { valid: true, value: false };
    }
    return { valid: true, value: Boolean(value) };
  },

  enum: (value, allowedValues, fieldName = 'Field') => {
    if (!allowedValues.includes(value)) {
      return { 
        valid: false, 
        error: `${fieldName} must be one of: ${allowedValues.join(', ')}` 
      };
    }
    return { valid: true, value };
  },

  array: (value, fieldName = 'Field') => {
    if (!Array.isArray(value)) {
      return { valid: false, error: `${fieldName} must be an array` };
    }
    return { valid: true, value: value.map(sanitizeObject) };
  },

  password: (value) => {
    if (!value || value.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    
    if (!hasUpper || !hasLower || !hasNumber) {
      return { 
        valid: false, 
        error: 'Password must contain uppercase, lowercase, and numbers' 
      };
    }
    return { valid: true, value };
  }
};

function validateBody(body, schema) {
  const errors = [];
  const validated = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];
    
    if (typeof rules === 'function') {
      const result = rules(value, field);
      if (!result.valid) {
        errors.push({ field, error: result.error });
      } else {
        validated[field] = result.value;
      }
    } else if (typeof rules === 'object') {
      const { validator, required, default: defaultValue } = rules;
      
      if (value === undefined || value === null || value === '') {
        if (required) {
          errors.push({ field, error: `${field} is required` });
        } else if (defaultValue !== undefined) {
          validated[field] = defaultValue;
        }
      } else {
        const result = validator(value, field);
        if (!result.valid) {
          errors.push({ field, error: result.error });
        } else {
          validated[field] = result.value;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: validated
  };
}

function validate(schema) {
  return (req, res) => {
    req.body = sanitizeObject(req.body);
    const result = validateBody(req.body, schema);
    
    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.errors
      });
      return { valid: false };
    }
    
    req.validatedBody = result.data;
    return { valid: true, data: result.data };
  };
}

module.exports = {
  validators,
  validate,
  validateBody,
  sanitizeString,
  sanitizeObject
};
