/**
 * HIPAA-Compliant Audit Logger
 * ClinicalCanvas EHR
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const EVENT_TYPES = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  PHI_VIEW: 'phi_view',
  PHI_CREATE: 'phi_create',
  PHI_UPDATE: 'phi_update',
  PHI_DELETE: 'phi_delete',
  PHI_EXPORT: 'phi_export',
  CLIENT_VIEW: 'client_view',
  CLIENT_CREATE: 'client_create',
  CLIENT_UPDATE: 'client_update',
  CLIENT_DELETE: 'client_delete',
  APPOINTMENT_VIEW: 'appointment_view',
  APPOINTMENT_CREATE: 'appointment_create',
  APPOINTMENT_UPDATE: 'appointment_update',
  APPOINTMENT_DELETE: 'appointment_delete',
  DOCUMENT_VIEW: 'document_view',
  DOCUMENT_CREATE: 'document_create',
  DOCUMENT_UPDATE: 'document_update',
  DOCUMENT_DELETE: 'document_delete',
  INVOICE_VIEW: 'invoice_view',
  INVOICE_CREATE: 'invoice_create',
  INVOICE_UPDATE: 'invoice_update',
  NOTE_VIEW: 'note_view',
  NOTE_CREATE: 'note_create',
  NOTE_UPDATE: 'note_update',
  SECURITY_VIOLATION: 'security_violation',
  RATE_LIMITED: 'rate_limited',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SYSTEM_ERROR: 'system_error',
  API_ERROR: 'api_error'
};

async function logAudit({
  userId = null,
  userType = 'provider',
  action,
  entityType = null,
  entityId = null,
  details = null,
  ipAddress = null,
  userAgent = null,
  success = true
}) {
  try {
    if (!process.env.DATABASE_URL) {
      console.log('[AUDIT]', { action, entityType, entityId, success });
      return;
    }

    await pool.query(`
      INSERT INTO audit_log 
      (user_id, user_type, action, entity_type, entity_id, details, ip_address, user_agent, success)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      userId,
      userType,
      action,
      entityType,
      entityId,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
      success
    ]);
  } catch (error) {
    console.error('[AUDIT ERROR]', error.message);
  }
}

async function logPhiAccess(req, action, entityType, entityId, details = null) {
  await logAudit({
    userId: req.user?.userId || null,
    userType: req.user?.role || 'unknown',
    action,
    entityType,
    entityId,
    details,
    ipAddress: req.clientInfo?.ipAddress || req.headers['x-forwarded-for']?.split(',')[0],
    userAgent: req.clientInfo?.userAgent || req.headers['user-agent'],
    success: true
  });
}

async function logAuth(req, action, userId = null, success = true, details = null) {
  await logAudit({
    userId,
    userType: 'provider',
    action,
    entityType: 'auth',
    entityId: userId,
    details,
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    success
  });
}

async function logSecurity(req, action, details = null) {
  await logAudit({
    userId: req.user?.userId || null,
    userType: req.user?.role || 'unknown',
    action,
    entityType: 'security',
    entityId: null,
    details,
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    success: false
  });
}

async function logError(req, error, context = null) {
  await logAudit({
    userId: req?.user?.userId || null,
    userType: req?.user?.role || 'unknown',
    action: EVENT_TYPES.SYSTEM_ERROR,
    entityType: 'error',
    entityId: null,
    details: {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context
    },
    ipAddress: req?.headers?.['x-forwarded-for']?.split(',')[0],
    userAgent: req?.headers?.['user-agent'],
    success: false
  });
}

async function queryAuditLogs({
  userId = null,
  action = null,
  entityType = null,
  entityId = null,
  startDate = null,
  endDate = null,
  limit = 100,
  offset = 0
}) {
  try {
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }
    if (action) {
      query += ` AND action = $${paramIndex++}`;
      params.push(action);
    }
    if (entityType) {
      query += ` AND entity_type = $${paramIndex++}`;
      params.push(entityType);
    }
    if (entityId) {
      query += ` AND entity_id = $${paramIndex++}`;
      params.push(entityId);
    }
    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('[AUDIT QUERY ERROR]', error.message);
    return [];
  }
}

async function getAuditStats(days = 30) {
  try {
    const result = await pool.query(`
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(CASE WHEN success = true THEN 1 END) as success_count,
        COUNT(CASE WHEN success = false THEN 1 END) as failure_count
      FROM audit_log
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY action
      ORDER BY count DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('[AUDIT STATS ERROR]', error.message);
    return [];
  }
}

module.exports = {
  EVENT_TYPES,
  logAudit,
  logPhiAccess,
  logAuth,
  logSecurity,
  logError,
  queryAuditLogs,
  getAuditStats
};
