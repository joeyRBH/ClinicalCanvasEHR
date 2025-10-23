// Test Brevo using existing notifications.js
const { sendEmail, sendSMS } = require('./utils/notifications');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Return environment status
      return res.status(200).json({
        brevo_api_key: !!process.env.BREVO_API_KEY,
        brevo_key_length: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.length : 0,
        twilio_sid: !!process.env.TWILIO_ACCOUNT_SID,
        twilio_token: !!process.env.TWILIO_AUTH_TOKEN,
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const { testType, email, phone } = req.body;

      if (testType === 'email') {
        // Test email using existing notifications.js
        const result = await sendEmail({
          to: email || 'test@example.com',
          subject: 'Brevo Test Email',
          body: 'This is a test email from ClinicalCanvas EHR via Brevo integration.'
        });

        return res.status(200).json({
          testType: 'email',
          result: result
        });
      }

      if (testType === 'sms') {
        // Test SMS using existing notifications.js
        const result = await sendSMS({
          to: phone || '+1234567890',
          body: 'Test SMS from ClinicalCanvas EHR via Twilio integration.'
        });

        return res.status(200).json({
          testType: 'sms',
          result: result
        });
      }
    }

    return res.status(400).json({ error: 'Invalid request' });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      error: error.message
    });
  }
}
