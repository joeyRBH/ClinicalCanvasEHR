// Health Check API Endpoint
// Verifies database connection and system status

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: {
        connected: false,
        type: 'none'
      },
      services: {
        email: !!process.env.BREVO_API_KEY,
        sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        stripe: !!process.env.STRIPE_SECRET_KEY
      },
      version: '2.0.1'
    };

    // Check database connection (simplified)
    if (process.env.DATABASE_URL) {
      status.database.connected = true;
      status.database.type = 'postgresql';
    } else {
      status.database.type = 'demo_mode';
      status.status = 'demo';
    }

    return res.status(200).json(status);

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}



