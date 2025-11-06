// Client Messages API
// Manages secure messaging between clients and practice

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
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

    // GET: Retrieve messages
    if (req.method === 'GET') {
      const { id, limit = 50, offset = 0, unreadOnly = false } = req.query;

      if (id) {
        // Get single message
        const messageResult = await executeQuery(
          `SELECT * FROM client_messages
           WHERE id = $1 AND client_id = $2`,
          [id, clientId]
        );

        if (messageResult.data.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Message not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: messageResult.data[0],
          message: 'Message retrieved successfully'
        });
      }

      // Get all messages with filters
      let query = `
        SELECT * FROM client_messages
        WHERE client_id = $1
      `;
      const params = [clientId];
      let paramCount = 2;

      if (unreadOnly === 'true') {
        query += ` AND is_read = false`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const messagesResult = await executeQuery(query, params);

      // Get counts
      const countsResult = await executeQuery(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
           COUNT(CASE WHEN priority = 'urgent' AND is_read = false THEN 1 END) as urgent_unread
         FROM client_messages
         WHERE client_id = $1`,
        [clientId]
      );

      return res.status(200).json({
        success: true,
        data: {
          messages: messagesResult.data,
          counts: countsResult.data[0],
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: parseInt(countsResult.data[0].total)
          }
        },
        message: 'Messages retrieved successfully'
      });
    }

    // POST: Send a new message (client to practice)
    if (req.method === 'POST' && !req.url.includes('/mark-read')) {
      const { subject, message, relatedEntityType, relatedEntityId } = req.body;

      if (!subject || !message) {
        return res.status(400).json({
          success: false,
          error: 'Subject and message are required'
        });
      }

      // Get client name for sender
      const clientResult = await executeQuery(
        'SELECT name FROM clients WHERE id = $1',
        [clientId]
      );

      const clientName = clientResult.data[0]?.name || 'Client';

      // Create message
      const createResult = await executeQuery(
        `INSERT INTO client_messages
         (client_id, subject, message, message_type, priority, sender_type,
          sender_id, sender_name, related_entity_type, related_entity_id)
         VALUES ($1, $2, $3, 'outgoing', 'normal', 'client', $4, $5, $6, $7)
         RETURNING *`,
        [clientId, subject, message, clientId, clientName,
         relatedEntityType || null, relatedEntityId || null]
      );

      // Log audit event
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await executeQuery(
        `INSERT INTO audit_log
         (user_id, user_type, action, entity_type, entity_id, ip_address, user_agent)
         VALUES ($1, 'client', 'send_message', 'client_message', $2, $3, $4)`,
        [clientId, createResult.data[0].id, ipAddress, userAgent]
      );

      return res.status(201).json({
        success: true,
        data: createResult.data[0],
        message: 'Message sent successfully'
      });
    }

    // PUT: Mark message as read
    if (req.method === 'PUT' || (req.method === 'POST' && req.url.includes('/mark-read'))) {
      const { id, markAllRead } = req.body;

      if (markAllRead) {
        // Mark all messages as read
        const updateResult = await executeQuery(
          `UPDATE client_messages
           SET is_read = true, read_at = CURRENT_TIMESTAMP
           WHERE client_id = $1 AND is_read = false
           RETURNING id`,
          [clientId]
        );

        return res.status(200).json({
          success: true,
          data: {
            updatedCount: updateResult.data.length
          },
          message: 'All messages marked as read'
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
      }

      // Mark single message as read
      const updateResult = await executeQuery(
        `UPDATE client_messages
         SET is_read = true, read_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND client_id = $2 AND is_read = false
         RETURNING *`,
        [id, clientId]
      );

      if (updateResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Message not found or already read'
        });
      }

      return res.status(200).json({
        success: true,
        data: updateResult.data[0],
        message: 'Message marked as read'
      });
    }

    // Invalid endpoint
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });

  } catch (error) {
    console.error('Client messages error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
