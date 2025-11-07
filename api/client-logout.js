// Client Portal Logout API
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

    const authHeader = req.headers.authorization;
    const sessionToken = req.body?.sessionToken;

    if (!authHeader && !sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    // Invalidate session
    if (sessionToken) {
      await executeQuery(
        `UPDATE client_sessions
         SET is_active = false
         WHERE session_token = $1`,
        [sessionToken]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Client logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
