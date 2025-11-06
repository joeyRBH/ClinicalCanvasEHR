// AWS SNS SMS API Endpoint
const { sendSMS } = require('./utils/notifications');

module.exports = async (req, res) => {
  // CORS headers
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, message, body } = req.body;

    // Support both 'message' and 'body' field names
    const smsBody = message || body;

    // Validate required fields
    if (!to || !smsBody) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message (or body)'
      });
    }

    // Send SMS using utility function
    const result = await sendSMS({ to, body: smsBody });

    // Return result
    return res.status(result.success ? 200 : 500).json(result);

  } catch (error) {
    console.error('❌ SMS API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
