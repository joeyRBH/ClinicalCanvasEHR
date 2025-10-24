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

    // Check if Brevo API key is available
    if (!process.env.BREVO_API_KEY) {
      console.log('⚠️ BREVO_API_KEY not found, using demo mode');
      return res.status(200).json({
        success: true,
        message: 'Demo mode - SMS would be sent to: ' + to,
        messageId: 'demo-sms-' + Date.now(),
        demo: true
      });
    }

    // Use Brevo for SMS
    const SibApiV3Sdk = require('@getbrevo/brevo');
    const apiInstance = new SibApiV3Sdk.TransactionalSmsApi();
    
    // Set API key
    apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

    // Create SMS object
    const sendTransacSms = new SibApiV3Sdk.SendTransacSms();
    sendTransacSms.sender = 'ClinicalCanvas';
    sendTransacSms.recipient = to;
    sendTransacSms.content = message;

    // Send SMS
    const result = await apiInstance.sendTransacSms(sendTransacSms);
    
    console.log('✅ SMS sent successfully to:', to);
    console.log('📱 Message ID:', result.messageId);

    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      messageId: result.messageId
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