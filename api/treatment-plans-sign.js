// Treatment Plans Sign API Endpoint
// Handles signing and locking of treatment plans for HIPAA compliance
// As a rule, all clinical documents MUST have timestamped clinician signatures

const { initDatabase, executeQuery } = require('./utils/database-connection');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    await initDatabase();

    const { plan_id, user_id, signature_data, action } = req.body;

    if (!plan_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'plan_id and user_id are required'
      });
    }

    // Helper function for audit logging
    async function logAudit(planId, auditAction, userId, details = {}) {
      await executeQuery(
        `INSERT INTO treatment_plan_audit_log (plan_id, action, user_id, user_type, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          planId,
          auditAction,
          userId,
          'staff',
          req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
          req.headers['user-agent'] || '',
          JSON.stringify(details)
        ]
      );
    }

    // Check if treatment plan exists
    const checkResult = await executeQuery(
      'SELECT * FROM treatment_plans WHERE id = $1',
      [plan_id]
    );

    if (checkResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Treatment plan not found'
      });
    }

    const plan = checkResult.data[0];

    // SIGN action - REQUIRED for all clinical documents
    if (action === 'sign') {
      if (plan.is_signed) {
        return res.status(400).json({
          success: false,
          error: 'Treatment plan is already signed'
        });
      }

      if (plan.is_locked) {
        return res.status(400).json({
          success: false,
          error: 'Treatment plan is locked and cannot be signed'
        });
      }

      // Sign the treatment plan with timestamp
      const result = await executeQuery(
        `UPDATE treatment_plans
         SET is_signed = true,
             signed_at = CURRENT_TIMESTAMP,
             signed_by = $1,
             signature_data = $2,
             is_locked = true,
             locked_at = CURRENT_TIMESTAMP,
             locked_by = $1
         WHERE id = $3
         RETURNING *`,
        [user_id, signature_data || null, plan_id]
      );

      // Log signing with timestamp
      await logAudit(plan_id, 'SIGN', user_id, {
        signature_method: signature_data ? 'electronic' : 'standard',
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Treatment plan signed and locked successfully with timestamp'
      });
    }

    // LOCK action (without signing)
    if (action === 'lock') {
      if (plan.is_locked) {
        return res.status(400).json({
          success: false,
          error: 'Treatment plan is already locked'
        });
      }

      // Lock the treatment plan
      const result = await executeQuery(
        `UPDATE treatment_plans
         SET is_locked = true,
             locked_at = CURRENT_TIMESTAMP,
             locked_by = $1
         WHERE id = $2
         RETURNING *`,
        [user_id, plan_id]
      );

      // Log locking
      await logAudit(plan_id, 'LOCK', user_id);

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Treatment plan locked successfully'
      });
    }

    // UNLOCK action (requires admin privileges in production)
    if (action === 'unlock') {
      if (!plan.is_locked) {
        return res.status(400).json({
          success: false,
          error: 'Treatment plan is not locked'
        });
      }

      if (plan.is_signed) {
        return res.status(403).json({
          success: false,
          error: 'Cannot unlock a signed treatment plan. Signed clinical documents are permanently locked for compliance.'
        });
      }

      // Unlock the treatment plan
      const result = await executeQuery(
        `UPDATE treatment_plans
         SET is_locked = false,
             locked_at = NULL,
             locked_by = NULL
         WHERE id = $1
         RETURNING *`,
        [plan_id]
      );

      // Log unlocking
      await logAudit(plan_id, 'UNLOCK', user_id, {
        warning: 'Treatment plan unlocked - administrative action'
      });

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Treatment plan unlocked successfully'
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action. Use: sign, lock, or unlock'
    });

  } catch (error) {
    console.error('Treatment Plans Sign API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
