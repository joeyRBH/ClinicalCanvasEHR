// Clinical Notes API Endpoint
// Manages AI-generated clinical notes with HIPAA audit logging

const { initDatabase, executeQuery } = require('./utils/database-connection');
const { requireAINoteTakerSubscription } = require('./utils/subscription-verification');

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
    async function logAudit(noteId, action, userId, details = {}) {
      await executeQuery(
        `INSERT INTO note_audit_log (note_id, action, user_id, user_type, user_name, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          noteId,
          action,
          userId || null,
          'staff', // Can be enhanced to detect user type
          null, // Can be enhanced to include user name
          req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
          req.headers['user-agent'] || '',
          JSON.stringify(details)
        ]
      );
    }

    // GET: Retrieve clinical notes
    if (req.method === 'GET') {
      const { id, client_id, appointment_id, limit = 50, offset = 0 } = req.query;

      if (id) {
        // Get single note with audit log
        const noteResult = await executeQuery(
          `SELECT cn.*,
                  c.name as client_name,
                  u1.full_name as created_by_name,
                  u2.full_name as signed_by_name
           FROM clinical_notes cn
           LEFT JOIN clients c ON cn.client_id = c.id
           LEFT JOIN users u1 ON cn.created_by = u1.id
           LEFT JOIN users u2 ON cn.signed_by = u2.id
           WHERE cn.id = $1`,
          [id]
        );

        if (!noteResult.success) {
          throw new Error(noteResult.error || 'Failed to retrieve note');
        }

        if (noteResult.data.length === 0) {
          return res.status(404).json({ success: false, error: 'Note not found' });
        }

        // Log access
        await logAudit(id, 'VIEW', req.query.user_id);

        return res.status(200).json({
          success: true,
          data: noteResult.data[0]
        });
      }

      // Get notes by client_id
      if (client_id) {
        const result = await executeQuery(
          `SELECT cn.id, cn.session_date, cn.session_type, cn.note_format,
                  cn.is_signed, cn.signed_at, cn.is_locked,
                  u1.full_name as created_by_name,
                  u2.full_name as signed_by_name
           FROM clinical_notes cn
           LEFT JOIN users u1 ON cn.created_by = u1.id
           LEFT JOIN users u2 ON cn.signed_by = u2.id
           WHERE cn.client_id = $1
           ORDER BY cn.session_date DESC
           LIMIT $2 OFFSET $3`,
          [client_id, limit, offset]
        );

        return res.status(200).json({
          success: true,
          data: result.data,
          count: result.data.length
        });
      }

      // Get notes by appointment_id
      if (appointment_id) {
        const result = await executeQuery(
          `SELECT cn.*, c.name as client_name,
                  u1.full_name as created_by_name,
                  u2.full_name as signed_by_name
           FROM clinical_notes cn
           LEFT JOIN clients c ON cn.client_id = c.id
           LEFT JOIN users u1 ON cn.created_by = u1.id
           LEFT JOIN users u2 ON cn.signed_by = u2.id
           WHERE cn.appointment_id = $1
           ORDER BY cn.created_at DESC`,
          [appointment_id]
        );

        return res.status(200).json({
          success: true,
          data: result.data
        });
      }

      // Get all notes (with limit)
      const result = await executeQuery(
        `SELECT cn.id, cn.client_id, cn.session_date, cn.session_type, cn.note_format,
                cn.is_signed, cn.signed_at, cn.created_at,
                c.name as client_name,
                u1.full_name as created_by_name
         FROM clinical_notes cn
         LEFT JOIN clients c ON cn.client_id = c.id
         LEFT JOIN users u1 ON cn.created_by = u1.id
         ORDER BY cn.session_date DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return res.status(200).json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    }

    // POST: Create new clinical note
    if (req.method === 'POST') {
      // SUBSCRIPTION VERIFICATION - Required for creating notes
      const subscriptionCheck = await requireAINoteTakerSubscription(req, res);
      if (!subscriptionCheck.verified) {
        return; // Response already sent by middleware
      }

      const {
        client_id,
        appointment_id,
        session_date,
        session_type,
        note_format,
        transcript,
        clinical_note,
        audio_file_url,
        duration_seconds,
        user_id
      } = req.body;

      // Validation
      if (!client_id || !clinical_note || !note_format) {
        return res.status(400).json({
          success: false,
          error: 'client_id, clinical_note, and note_format are required'
        });
      }

      // Insert note
      const result = await executeQuery(
        `INSERT INTO clinical_notes
         (client_id, appointment_id, session_date, session_type, note_format,
          transcript, clinical_note, audio_file_url, duration_seconds, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          client_id,
          appointment_id || null,
          session_date || new Date(),
          session_type || 'individual',
          note_format,
          transcript || null,
          clinical_note,
          audio_file_url || null,
          duration_seconds || null,
          user_id || null
        ]
      );

      // Check if query succeeded
      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error(result.error || 'Failed to insert clinical note');
      }

      const noteId = result.data[0].id;

      // Log creation
      await logAudit(noteId, 'CREATE', user_id, {
        client_id,
        note_format,
        session_type
      });

      return res.status(201).json({
        success: true,
        data: result.data[0],
        message: 'Clinical note created successfully'
      });
    }

    // PUT: Update clinical note
    if (req.method === 'PUT') {
      // SUBSCRIPTION VERIFICATION - Required for editing notes
      const subscriptionCheck = await requireAINoteTakerSubscription(req, res);
      if (!subscriptionCheck.verified) {
        return; // Response already sent by middleware
      }

      const { id, clinical_note, note_format, transcript, user_id } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Note ID is required'
        });
      }

      // Check if note exists and is not locked or signed
      const checkResult = await executeQuery(
        'SELECT is_signed, is_locked FROM clinical_notes WHERE id = $1',
        [id]
      );

      if (!checkResult.success) {
        throw new Error(checkResult.error || 'Failed to check note status');
      }

      if (checkResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }

      if (checkResult.data[0].is_signed) {
        return res.status(403).json({
          success: false,
          error: 'Cannot edit signed note'
        });
      }

      if (checkResult.data[0].is_locked) {
        return res.status(403).json({
          success: false,
          error: 'Note is locked and cannot be edited'
        });
      }

      // Update note
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (clinical_note !== undefined) {
        updateFields.push(`clinical_note = $${paramCount++}`);
        values.push(clinical_note);
      }
      if (note_format !== undefined) {
        updateFields.push(`note_format = $${paramCount++}`);
        values.push(note_format);
      }
      if (transcript !== undefined) {
        updateFields.push(`transcript = $${paramCount++}`);
        values.push(transcript);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      values.push(id);
      const result = await executeQuery(
        `UPDATE clinical_notes
         SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error(result.error || 'Failed to update clinical note');
      }

      // Log update
      await logAudit(id, 'UPDATE', user_id, {
        fields_updated: updateFields.map(f => f.split(' = ')[0])
      });

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Clinical note updated successfully'
      });
    }

    // DELETE: Delete clinical note
    if (req.method === 'DELETE') {
      // SUBSCRIPTION VERIFICATION - Required for deleting notes
      const subscriptionCheck = await requireAINoteTakerSubscription(req, res);
      if (!subscriptionCheck.verified) {
        return; // Response already sent by middleware
      }

      const { id, user_id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Note ID is required'
        });
      }

      // Check if note can be deleted (not signed or locked)
      const checkResult = await executeQuery(
        'SELECT is_signed, is_locked FROM clinical_notes WHERE id = $1',
        [id]
      );

      if (!checkResult.success) {
        throw new Error(checkResult.error || 'Failed to check note status');
      }

      if (checkResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }

      if (checkResult.data[0].is_signed) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete signed note'
        });
      }

      if (checkResult.data[0].is_locked) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete locked note'
        });
      }

      // Log deletion before deleting
      await logAudit(id, 'DELETE', user_id);

      // Delete note (audit log entries will cascade delete)
      await executeQuery('DELETE FROM clinical_notes WHERE id = $1', [id]);

      return res.status(200).json({
        success: true,
        message: 'Clinical note deleted successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Clinical Notes API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
