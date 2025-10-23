// Brevo SMS API - Fresh Implementation
export default async function handler(req, res) {
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
    const { to, message } = req.body;

    // Check if Twilio credentials are available
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('⚠️ Twilio credentials not found, using demo mode');
      return res.status(200).json({
        success: true,
        message: 'Demo mode - SMS would be sent to: ' + to,
        messageId: 'demo-sms-' + Date.now(),
        demo: true
      });
    }

    // Use Twilio for SMS
    const twilio = await import('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      to: to
    });

    console.log('✅ SMS sent successfully to:', to);
    console.log('📱 Message ID:', result.sid);

    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      messageId: result.sid
    });

  } catch (error) {
    console.error('❌ SMS send error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.moreInfo || 'No additional details'
    });
  }
}