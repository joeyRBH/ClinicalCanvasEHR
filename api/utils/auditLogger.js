/**
 * HIPAA-Compliant Audit Logging
 * Tracks all PHI access and modifications
 */

import { neon } from '@neondatabase/serverless';
import { getClientIP, getUserAgent } from './auth.js';

const sql = neon(process.env.DATABASE_URL);

/**
 * Audit event types for HIPAA compliance
 */
export const AuditEventType = {
  // Authentication events
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  
  // PHI Access events
  PHI_READ: 'PHI_READ',
  PHI_CREATE: 'PHI_CREATE',
  PHI_UPDATE: 'PHI_UPDATE',
  PHI_DELETE: 'PHI_DELETE',
  PHI_EXPORT: 'PHI_EXPORT',
  
  // Client events
  CLIENT_VIEW: 'CLIENT_VIEW',
  CLIENT_CREATE: 'CLIENT_CREATE',
  CLIENT_UPDATE: 'CLIENT_UPDATE',
  CLIENT_DELETE: 'CLIENT_DELETE',
  
  // Appointment events
  APPOINTMENT_VIEW: 'APPOINTMENT_VIEW',
  APPOINTMENT_CREATE: 'APPOINTMENT_CREATE',
  APPOINTMENT_UPDATE: 'APPOINTMENT_UPDATE',
  APPOINTMENT_DELETE: 'APPOINTMENT_DELETE',
  
  // Document events
  DOCUMENT_VIEW: 'DOCUMENT_VIEW',
  DOCUMENT_CREATE: 'DOCUMENT_CREATE',
  DOCUMENT_UPDATE: 'DOCUMENT_UPDATE',
  DOCUMENT_SIGN: 'DOCUMENT_SIGN',
  DOCUMENT_ASSIGN: 'DOCUMENT_ASSIGN',
  
  // Invoice events
  INVOICE_VIEW: 'INVOICE_VIEW',
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_UPDATE: 'INVOICE_UPDATE',
  
  // System events
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

/**
 * Log audit event
 * @param {Object} event - Audit event details
 */
export async function logAuditEvent(event) {
  try {
    const {
      userId = null,
      username = 'system',
      eventType,
      resource,
      resourceId = null,
      action,
      ipAddress,
      userAgent,
      details = null,
      success = true,
      errorMessage = null
    } = event;

    await sql`
      INSERT INTO audit_log (
        user_id,
        username,
        event_type,
        resource,
        resource_id,
        action,
        ip_address,
        user_agent,
        details,
        success,
        error_message,
        timestamp
      ) VALUES (
        ${userId},
        ${username},
        ${eventType},
        ${resource},
        ${resourceId},
        ${action},
        ${ipAddress},
        ${userAgent},
        ${details ? JSON.stringify(details) : null},
        ${success},
        ${errorMessage},
        NOW()
      )
    `;

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', {
        timestamp: new Date().toISOString(),
        username,
        eventType,
        resource,
        resourceId,
        action,
        success
      });
    }
  } catch (error) {
    // Audit logging should never fail the main operation
    console.error('Audit logging error:', error.message);
  }
}

/**
 * Middleware to automatically log PHI access
 */
export function auditMiddleware(eventType, resource) {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    let responseLogged = false;
    
    const logResponse = async (data, statusCode) => {
      if (responseLogged) return;
      responseLogged = true;
      
      try {
        const success = statusCode < 400;
        const resourceId = req.params.id || req.query.id || req.body?.id || null;
        
        await logAuditEvent({
          userId: req.user?.id,
          username: req.user?.username || 'anonymous',
          eventType,
          resource,
          resourceId,
          action: req.method,
          ipAddress: getClientIP(req),
          userAgent: getUserAgent(req),
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode
          },
          success,
          errorMessage: !success ? data?.error?.message : null
        });
      } catch (error) {
        console.error('Audit middleware error:', error);
      }
    };
    
    // Intercept response
    res.json = function(data) {
      logResponse(data, res.statusCode);
      return originalJson(data);
    };
    
    res.send = function(data) {
      logResponse(data, res.statusCode);
      return originalSend(data);
    };
    
    next();
  };
}

/**
 * Create audit log table if it doesn't exist
 */
export async function initializeAuditLog() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        resource VARCHAR(50) NOT NULL,
        resource_id VARCHAR(50),
        action VARCHAR(20) NOT NULL,
        ip_address VARCHAR(50),
        user_agent TEXT,
        details JSONB,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create indexes for better query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource, resource_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC)`;
    
    console.log('Audit log table initialized');
  } catch (error) {
    console.error('Failed to initialize audit log:', error.message);
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(filters = {}) {
  const {
    userId,
    eventType,
    resource,
    startDate,
    endDate,
    limit = 100,
    offset = 0
  } = filters;
  
  let query = `
    SELECT * FROM audit_log
    WHERE 1=1
  `;
  const params = [];
  
  if (userId) {
    params.push(userId);
    query += ` AND user_id = $${params.length}`;
  }
  
  if (eventType) {
    params.push(eventType);
    query += ` AND event_type = $${params.length}`;
  }
  
  if (resource) {
    params.push(resource);
    query += ` AND resource = $${params.length}`;
  }
  
  if (startDate) {
    params.push(startDate);
    query += ` AND timestamp >= $${params.length}`;
  }
  
  if (endDate) {
    params.push(endDate);
    query += ` AND timestamp <= $${params.length}`;
  }
  
  query += ` ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`;
  
  return await sql.unsafe(query, params);
}

/**
 * Get audit statistics
 */
export async function getAuditStats(days = 30) {
  const stats = await sql`
    SELECT 
      event_type,
      COUNT(*) as count,
      COUNT(CASE WHEN success = false THEN 1 END) as failed_count,
      COUNT(DISTINCT user_id) as unique_users
    FROM audit_log
    WHERE timestamp >= NOW() - INTERVAL '${days} days'
    GROUP BY event_type
    ORDER BY count DESC
  `;
  
  return stats;
}



