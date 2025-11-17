// Treatment Plans API Endpoint
// Manages clinical treatment plans with HIPAA audit logging and timestamped signatures

const { initDatabase, executeQuery } = require('./utils/database-connection');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    // Helper function for audit logging
    async function logAudit(planId, action, userId, details = {}) {
      await executeQuery(
        `INSERT INTO treatment_plan_audit_log (plan_id, action, user_id, user_type, user_name, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          planId,
          action,
          userId || null,
          'staff',
          null,
          req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
          req.headers['user-agent'] || '',
          JSON.stringify(details)
        ]
      );
    }

    // GET: Retrieve treatment plans
    if (req.method === 'GET') {
      const { id, client_id, limit = 50, offset = 0 } = req.query;

      if (id) {
        // Get single treatment plan with full details
        const planResult = await executeQuery(
          `SELECT tp.*,
                  c.name as client_name,
                  u1.full_name as created_by_name,
                  u2.full_name as signed_by_name
           FROM treatment_plans tp
           LEFT JOIN clients c ON tp.client_id = c.id
           LEFT JOIN users u1 ON tp.created_by = u1.id
           LEFT JOIN users u2 ON tp.signed_by = u2.id
           WHERE tp.id = $1`,
          [id]
        );

        if (!planResult.success) {
          throw new Error(planResult.error || 'Failed to retrieve treatment plan');
        }

        if (planResult.data.length === 0) {
          return res.status(404).json({ success: false, error: 'Treatment plan not found' });
        }

        // Log access
        await logAudit(id, 'VIEW', req.query.user_id);

        return res.status(200).json({
          success: true,
          data: planResult.data[0]
        });
      }

      // Get treatment plans by client_id
      if (client_id) {
        const result = await executeQuery(
          `SELECT tp.id, tp.plan_date, tp.review_date, tp.status, tp.treatment_frequency,
                  tp.is_signed, tp.signed_at, tp.is_locked, tp.created_at,
                  u1.full_name as created_by_name,
                  u2.full_name as signed_by_name
           FROM treatment_plans tp
           LEFT JOIN users u1 ON tp.created_by = u1.id
           LEFT JOIN users u2 ON tp.signed_by = u2.id
           WHERE tp.client_id = $1
           ORDER BY tp.plan_date DESC
           LIMIT $2 OFFSET $3`,
          [client_id, limit, offset]
        );

        return res.status(200).json({
          success: true,
          data: result.data,
          count: result.data.length
        });
      }

      // Get all treatment plans (with limit)
      const result = await executeQuery(
        `SELECT tp.id, tp.client_id, tp.plan_date, tp.review_date, tp.status,
                tp.treatment_frequency, tp.is_signed, tp.signed_at, tp.created_at,
                c.name as client_name,
                u1.full_name as created_by_name
         FROM treatment_plans tp
         LEFT JOIN clients c ON tp.client_id = c.id
         LEFT JOIN users u1 ON tp.created_by = u1.id
         ORDER BY tp.plan_date DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    }

    // POST: Create new treatment plan
    if (req.method === 'POST') {
      const {
        client_id,
        diagnoses,
        presenting_problems,
        goals,
        objective_data,
        treatment_frequency,
        plan_date,
        review_date,
        status,
        user_id
      } = req.body;

      // Validation - ensure required fields are present
      if (!client_id || !diagnoses || !presenting_problems || !goals || !treatment_frequency) {
        return res.status(400).json({
          success: false,
          error: 'client_id, diagnoses, presenting_problems, goals, and treatment_frequency are required'
        });
      }

      // Insert treatment plan
      const result = await executeQuery(
        `INSERT INTO treatment_plans
         (client_id, diagnoses, presenting_problems, goals, objective_data,
          treatment_frequency, plan_date, review_date, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          client_id,
          diagnoses,
          presenting_problems,
          goals,
          objective_data || null,
          treatment_frequency,
          plan_date || new Date(),
          review_date || null,
          status || 'active',
          user_id || null
        ]
      );

      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error(result.error || 'Failed to insert treatment plan');
      }

      const planId = result.data[0].id;

      // Log creation
      await logAudit(planId, 'CREATE', user_id, {
        client_id,
        treatment_frequency,
        status: status || 'active'
      });

      return res.status(201).json({
        success: true,
        data: result.data[0],
        message: 'Treatment plan created successfully'
      });
    }

    // PUT: Update treatment plan
    if (req.method === 'PUT') {
      const {
        id,
        diagnoses,
        presenting_problems,
        goals,
        objective_data,
        treatment_frequency,
        plan_date,
        review_date,
        status,
        user_id
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Treatment plan ID is required'
        });
      }

      // Check if plan exists and is not locked or signed
      const checkResult = await executeQuery(
        'SELECT is_signed, is_locked FROM treatment_plans WHERE id = $1',
        [id]
      );

      if (!checkResult.success) {
        throw new Error(checkResult.error || 'Failed to check treatment plan status');
      }

      if (checkResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Treatment plan not found'
        });
      }

      if (checkResult.data[0].is_signed) {
        return res.status(403).json({
          success: false,
          error: 'Cannot edit signed treatment plan. Signed clinical documents are locked for compliance.'
        });
      }

      if (checkResult.data[0].is_locked) {
        return res.status(403).json({
          success: false,
          error: 'Treatment plan is locked and cannot be edited'
        });
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (diagnoses !== undefined) {
        updateFields.push(`diagnoses = $${paramCount++}`);
        values.push(diagnoses);
      }
      if (presenting_problems !== undefined) {
        updateFields.push(`presenting_problems = $${paramCount++}`);
        values.push(presenting_problems);
      }
      if (goals !== undefined) {
        updateFields.push(`goals = $${paramCount++}`);
        values.push(goals);
      }
      if (objective_data !== undefined) {
        updateFields.push(`objective_data = $${paramCount++}`);
        values.push(objective_data);
      }
      if (treatment_frequency !== undefined) {
        updateFields.push(`treatment_frequency = $${paramCount++}`);
        values.push(treatment_frequency);
      }
      if (plan_date !== undefined) {
        updateFields.push(`plan_date = $${paramCount++}`);
        values.push(plan_date);
      }
      if (review_date !== undefined) {
        updateFields.push(`review_date = $${paramCount++}`);
        values.push(review_date);
      }
      if (status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      values.push(id);
      const result = await executeQuery(
        `UPDATE treatment_plans
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error(result.error || 'Failed to update treatment plan');
      }

      // Log update
      await logAudit(id, 'UPDATE', user_id, {
        fields_updated: updateFields.map(f => f.split(' = ')[0])
      });

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Treatment plan updated successfully'
      });
    }

    // DELETE: Delete treatment plan
    if (req.method === 'DELETE') {
      const { id, user_id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Treatment plan ID is required'
        });
      }

      // Check if plan can be deleted (not signed or locked)
      const checkResult = await executeQuery(
        'SELECT is_signed, is_locked FROM treatment_plans WHERE id = $1',
        [id]
      );

      if (!checkResult.success) {
        throw new Error(checkResult.error || 'Failed to check treatment plan status');
      }

      if (checkResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Treatment plan not found'
        });
      }

      if (checkResult.data[0].is_signed) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete signed treatment plan. Signed clinical documents are permanent.'
        });
      }

      if (checkResult.data[0].is_locked) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete locked treatment plan'
        });
      }

      // Log deletion before deleting
      await logAudit(id, 'DELETE', user_id);

      // Delete plan (audit log entries will cascade delete)
      await executeQuery('DELETE FROM treatment_plans WHERE id = $1', [id]);

      return res.status(200).json({
        success: true,
        message: 'Treatment plan deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Treatment Plans API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
