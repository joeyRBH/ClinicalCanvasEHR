// Clinical Notes Sign API Endpoint
// Handles signing and locking of clinical notes for HIPAA compliance

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

    const { note_id, user_id, signature_data, action } = req.body;

    if (!note_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'note_id and user_id are required'
      });
    }

    // Helper function for audit logging
    async function logAudit(noteId, auditAction, userId, details = {}) {
      await executeQuery(
        `INSERT INTO note_audit_log (note_id, action, user_id, user_type, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          noteId,
          auditAction,
          userId,
          'staff',
          req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
          req.headers['user-agent'] || '',
          JSON.stringify(details)
        ]
      );
    }

    // Check if note exists
    const checkResult = await executeQuery(
      'SELECT * FROM clinical_notes WHERE id = $1',
      [note_id]
    );

    if (checkResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    const note = checkResult.data[0];

    // SIGN action
    if (action === 'sign') {
      if (note.is_signed) {
        return res.status(400).json({
          success: false,
          error: 'Note is already signed'
        });
      }

      if (note.is_locked) {
        return res.status(400).json({
          success: false,
          error: 'Note is locked and cannot be signed'
        });
      }

      // Sign the note
      const result = await executeQuery(
        `UPDATE clinical_notes
         SET is_signed = true,
             signed_at = CURRENT_TIMESTAMP,
             signed_by = $1,
             signature_data = $2,
             is_locked = true,
             locked_at = CURRENT_TIMESTAMP,
             locked_by = $1
         WHERE id = $3
         RETURNING *`,
        [user_id, signature_data || null, note_id]
      );

      // Log signing
      await logAudit(note_id, 'SIGN', user_id, {
        signature_method: signature_data ? 'electronic' : 'standard'
      });

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Note signed and locked successfully'
      });
    }

    // LOCK action (without signing)
    if (action === 'lock') {
      if (note.is_locked) {
        return res.status(400).json({
          success: false,
          error: 'Note is already locked'
        });
      }

      // Lock the note
      const result = await executeQuery(
        `UPDATE clinical_notes
         SET is_locked = true,
             locked_at = CURRENT_TIMESTAMP,
             locked_by = $1
         WHERE id = $2
         RETURNING *`,
        [user_id, note_id]
      );

      // Log locking
      await logAudit(note_id, 'LOCK', user_id);

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Note locked successfully'
      });
    }

    // UNLOCK action (requires admin privileges in production)
    if (action === 'unlock') {
      if (!note.is_locked) {
        return res.status(400).json({
          success: false,
          error: 'Note is not locked'
        });
      }

      if (note.is_signed) {
        return res.status(403).json({
          success: false,
          error: 'Cannot unlock a signed note. Signed notes are permanently locked.'
        });
      }

      // Unlock the note
      const result = await executeQuery(
        `UPDATE clinical_notes
         SET is_locked = false,
             locked_at = NULL,
             locked_by = NULL
         WHERE id = $1
         RETURNING *`,
        [note_id]
      );

      // Log unlocking
      await logAudit(note_id, 'UNLOCK', user_id, {
        warning: 'Note unlocked - administrative action'
      });

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Note unlocked successfully'
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action. Use: sign, lock, or unlock'
    });

  } catch (error) {
    console.error('Clinical Notes Sign API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
