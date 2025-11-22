// Client Notifications API
// Manages notification history and preferences for client portal

const { initDatabase, executeQuery } = require('./utils/database-connection');

// Helper function to verify session token
async function verifySession(sessionToken) {
  if (!sessionToken) return null;

  const result = await executeQuery(
    `SELECT cs.*, cu.client_id, cu.email
     FROM client_sessions cs
     JOIN client_users cu ON cs.client_user_id = cu.id
     WHERE cs.session_token = $1
       AND cs.is_active = true
       AND cs.expires_at > CURRENT_TIMESTAMP`,
    [sessionToken]
  );

  return result.data.length > 0 ? result.data[0] : null;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    // Extract session token from header
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader ? authHeader.replace('Bearer ', '') : req.query.sessionToken || req.body.sessionToken;

    // Verify session
    const session = await verifySession(sessionToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - invalid or expired session'
      });
    }

    const clientId = session.client_id;

    // GET: Retrieve notification history
    if (req.method === 'GET') {
      const {
        limit = 50,
        offset = 0,
        type,
        status,
        startDate,
        endDate
      } = req.query;

      // Build query with filters
      let query = `
        SELECT id, notification_type, notification_category, subject, message,
               delivery_method, recipient_email, recipient_phone, status,
               sent_at, delivered_at, opened_at, failed_at, error_message,
               related_entity_type, related_entity_id, created_at
        FROM notification_log
        WHERE client_id = $1
      `;

      const params = [clientId];
      let paramCount = 2;

      if (type) {
        query += ` AND notification_type = $${paramCount}`;
        params.push(type);
        paramCount++;
      }

      if (status) {
        query += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      if (startDate) {
        query += ` AND created_at >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      }

      if (endDate) {
        query += ` AND created_at <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const notificationsResult = await executeQuery(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM notification_log WHERE client_id = $1`;
      const countParams = [clientId];
      let countParamIndex = 2;

      if (type) {
        countQuery += ` AND notification_type = $${countParamIndex}`;
        countParams.push(type);
        countParamIndex++;
      }

      if (status) {
        countQuery += ` AND status = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }

      if (startDate) {
        countQuery += ` AND created_at >= $${countParamIndex}`;
        countParams.push(startDate);
        countParamIndex++;
      }

      if (endDate) {
        countQuery += ` AND created_at <= $${countParamIndex}`;
        countParams.push(endDate);
      }

      const countResult = await executeQuery(countQuery, countParams);

      // Get notification statistics
      const statsResult = await executeQuery(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
           COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
           COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
           COUNT(CASE WHEN delivery_method = 'email' THEN 1 END) as email_count,
           COUNT(CASE WHEN delivery_method = 'sms' THEN 1 END) as sms_count
         FROM notification_log
         WHERE client_id = $1`,
        [clientId]
      );

      return res.status(200).json({
        success: true,
        data: {
          notifications: notificationsResult.data,
          pagination: {
            total: parseInt(countResult.data[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult.data[0].total)
          },
          statistics: statsResult.data[0]
        },
        message: 'Notifications retrieved successfully'
      });
    }

    // POST: Mark notification as read/opened
    if (req.method === 'POST' && req.url.includes('/mark-opened')) {
      const { notificationId } = req.body;

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          error: 'Notification ID is required'
        });
      }

      // Verify notification belongs to this client
      const verifyResult = await executeQuery(
        'SELECT id FROM notification_log WHERE id = $1 AND client_id = $2',
        [notificationId, clientId]
      );

      if (verifyResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      // Update notification
      const updateResult = await executeQuery(
        `UPDATE notification_log
         SET opened_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND opened_at IS NULL
         RETURNING *`,
        [notificationId]
      );

      return res.status(200).json({
        success: true,
        data: updateResult.data[0],
        message: 'Notification marked as opened'
      });
    }

    // Invalid endpoint
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });

  } catch (error) {
    console.error('Client notifications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
