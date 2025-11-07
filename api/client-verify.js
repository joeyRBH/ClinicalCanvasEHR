// Client Portal Session Verification API
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

    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Session token required'
      });
    }

    const sessionResult = await executeQuery(
      `SELECT cs.*, cu.email, cu.is_active, cu.client_id, c.name, c.status
       FROM client_sessions cs
       JOIN client_users cu ON cs.client_user_id = cu.id
       JOIN clients c ON cu.client_id = c.id
       WHERE cs.session_token = $1
         AND cs.is_active = true
         AND cs.expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (!sessionResult.success || sessionResult.data.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session'
      });
    }

    const session = sessionResult.data[0];

    // Update last activity
    await executeQuery(
      `UPDATE client_sessions
       SET last_activity = CURRENT_TIMESTAMP
       WHERE session_token = $1`,
      [sessionToken]
    );

    // Handle both camelCase and snake_case
    const clientId = session.clientId || session.client_id;

    return res.status(200).json({
      success: true,
      message: 'Session valid',
      data: {
        clientId: clientId,
        email: session.email,
        name: session.name
      }
    });

  } catch (error) {
    console.error('Client verify error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
