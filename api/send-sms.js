// Twilio SMS API Endpoint
const { sendSMS } = require('./utils/notifications');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle both nested (smsData) and flat (direct) data structures
    let to, smsBody;

    if (req.body.smsData) {
      // Nested structure from appointment reminders
      to = req.body.smsData.to;
      smsBody = req.body.smsData.message || req.body.smsData.body;
    } else {
      // Flat structure from direct calls
      to = req.body.to;
      smsBody = req.body.message || req.body.body;
    }

    // Validate required fields
    if (!to || !smsBody) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message (or body)',
        received: req.body
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
