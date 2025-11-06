// Client Settings API
// Manages client notification preferences and account settings

const { initDatabase, executeQuery } = require('./utils/database-connection');
const bcrypt = require('bcrypt');

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
    const sessionToken = authHeader ? authHeader.replace('Bearer ', '') : req.body.sessionToken;

    // Verify session
    const session = await verifySession(sessionToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - invalid or expired session'
      });
    }

    const clientId = session.client_id;

    // GET: Retrieve notification settings
    if (req.method === 'GET') {
      const settingsResult = await executeQuery(
        'SELECT * FROM client_notification_settings WHERE client_id = $1',
        [clientId]
      );

      if (settingsResult.data.length === 0) {
        // Create default settings if they don't exist
        await executeQuery(
          `INSERT INTO client_notification_settings (client_id)
           VALUES ($1)`,
          [clientId]
        );

        const newSettingsResult = await executeQuery(
          'SELECT * FROM client_notification_settings WHERE client_id = $1',
          [clientId]
        );

        return res.status(200).json({
          success: true,
          data: newSettingsResult.data[0],
          message: 'Default settings created'
        });
      }

      return res.status(200).json({
        success: true,
        data: settingsResult.data[0],
        message: 'Settings retrieved successfully'
      });
    }

    // PUT: Update notification settings
    if (req.method === 'PUT') {
      const {
        email_notifications,
        email_appointment_reminders,
        email_appointment_confirmations,
        email_invoice_reminders,
        email_payment_receipts,
        email_document_updates,
        email_marketing,
        sms_notifications,
        sms_appointment_reminders,
        sms_appointment_confirmations,
        sms_invoice_reminders,
        sms_payment_receipts,
        preferred_contact_method,
        reminder_advance_hours,
        notification_frequency,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        timezone
      } = req.body;

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      const addUpdate = (field, value) => {
        if (value !== undefined) {
          updates.push(`${field} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      };

      addUpdate('email_notifications', email_notifications);
      addUpdate('email_appointment_reminders', email_appointment_reminders);
      addUpdate('email_appointment_confirmations', email_appointment_confirmations);
      addUpdate('email_invoice_reminders', email_invoice_reminders);
      addUpdate('email_payment_receipts', email_payment_receipts);
      addUpdate('email_document_updates', email_document_updates);
      addUpdate('email_marketing', email_marketing);
      addUpdate('sms_notifications', sms_notifications);
      addUpdate('sms_appointment_reminders', sms_appointment_reminders);
      addUpdate('sms_appointment_confirmations', sms_appointment_confirmations);
      addUpdate('sms_invoice_reminders', sms_invoice_reminders);
      addUpdate('sms_payment_receipts', sms_payment_receipts);
      addUpdate('preferred_contact_method', preferred_contact_method);
      addUpdate('reminder_advance_hours', reminder_advance_hours);
      addUpdate('notification_frequency', notification_frequency);
      addUpdate('quiet_hours_enabled', quiet_hours_enabled);
      addUpdate('quiet_hours_start', quiet_hours_start);
      addUpdate('quiet_hours_end', quiet_hours_end);
      addUpdate('timezone', timezone);

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No settings to update'
        });
      }

      values.push(clientId);

      const updateResult = await executeQuery(
        `UPDATE client_notification_settings
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE client_id = $${paramCount}
         RETURNING *`,
        values
      );

      if (updateResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Settings not found'
        });
      }

      // Log audit event
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await executeQuery(
        `INSERT INTO audit_log
         (user_id, user_type, action, entity_type, entity_id, ip_address, user_agent, details)
         VALUES ($1, 'client', 'update_settings', 'client_notification_settings', $2, $3, $4, $5)`,
        [clientId, updateResult.data[0].id, ipAddress, userAgent, JSON.stringify(req.body)]
      );

      return res.status(200).json({
        success: true,
        data: updateResult.data[0],
        message: 'Settings updated successfully'
      });
    }

    // POST: Update password
    if (req.method === 'POST' && req.url.includes('/password')) {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 8 characters long'
        });
      }

      // Get current user
      const userResult = await executeQuery(
        'SELECT * FROM client_users WHERE client_id = $1',
        [clientId]
      );

      if (userResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = userResult.data[0];

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await executeQuery(
        `UPDATE client_users
         SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newPasswordHash, user.id]
      );

      // Log audit event
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await executeQuery(
        `INSERT INTO audit_log
         (user_id, user_type, action, entity_type, entity_id, ip_address, user_agent)
         VALUES ($1, 'client', 'change_password', 'client_user', $2, $3, $4)`,
        [clientId, user.id, ipAddress, userAgent]
      );

      // Invalidate all other sessions for security
      await executeQuery(
        `UPDATE client_sessions
         SET is_active = false
         WHERE client_user_id = $1 AND session_token != $2`,
        [user.id, sessionToken]
      );

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    }

    // Invalid endpoint
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });

  } catch (error) {
    console.error('Client settings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
