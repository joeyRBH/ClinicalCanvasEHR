// Clinical Notes Audit Log API Endpoint
// Retrieves audit log for clinical notes (HIPAA compliance)

const { initDatabase, executeQuery } = require('./utils/database-connection');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    await initDatabase();

    const { note_id, limit = 100, offset = 0 } = req.query;

    if (!note_id) {
      return res.status(400).json({
        success: false,
        error: 'note_id is required'
      });
    }

    // Get audit log entries for the note
    const result = await executeQuery(
      `SELECT nal.*,
              u.full_name as user_full_name,
              u.email as user_email
       FROM note_audit_log nal
       LEFT JOIN users u ON nal.user_id = u.id
       WHERE nal.note_id = $1
       ORDER BY nal.created_at DESC
       LIMIT $2 OFFSET $3`,
      [note_id, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      count: result.data.length
    });

  } catch (error) {
    console.error('Clinical Notes Audit API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
