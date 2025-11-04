// Test Notification System (AWS SES + Twilio)
const { sendEmail, sendSMS, sendDualNotification, sendTemplateNotification } = require('./utils/notifications');

module.exports = async (req, res) => {
  // CORS headers
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Return environment status
      return res.status(200).json({
        aws_ses: {
          access_key_set: !!process.env.AWS_SES_ACCESS_KEY_ID,
          secret_key_set: !!process.env.AWS_SES_SECRET_ACCESS_KEY,
          region: process.env.AWS_SES_REGION || 'us-east-1 (default)'
        },
        twilio: {
          account_sid_set: !!process.env.TWILIO_ACCOUNT_SID,
          auth_token_set: !!process.env.TWILIO_AUTH_TOKEN,
          phone_number_set: !!process.env.TWILIO_PHONE_NUMBER
        },
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const { testType, email, phone } = req.body;

      if (testType === 'email') {
        // Test email
        const result = await sendEmail({
          to: email || 'test@example.com',
          subject: 'ClinicalCanvas Test Email',
          body: 'This is a test email from ClinicalCanvas EHR using AWS SES.\n\nIf you received this, your email notifications are working!',
          from: 'notifications@clinicalcanvas.app'
        });

        return res.status(200).json({
          testType: 'email',
          result: result
        });
      }

      if (testType === 'sms') {
        // Test SMS
        const result = await sendSMS({
          to: phone || '+15551234567',
          body: 'Test SMS from ClinicalCanvas EHR using Twilio. If you received this, your SMS notifications are working!'
        });

        return res.status(200).json({
          testType: 'sms',
          result: result
        });
      }

      if (testType === 'dual') {
        // Test both email and SMS
        const result = await sendDualNotification({
          email: email || 'test@example.com',
          phone: phone || '+15551234567',
          subject: 'ClinicalCanvas Dual Notification Test',
          body: 'This is a test of the dual notification system (email + SMS).\n\nIf you received this, your notifications are working!'
        });

        return res.status(200).json({
          testType: 'dual',
          result: result
        });
      }

      if (testType === 'template') {
        // Test template notification
        const result = await sendTemplateNotification(
          'paymentReceived',
          {
            client_name: 'Test Client',
            invoice_number: 'TEST-001',
            total_amount: 100.00
          },
          {
            email: email || 'test@example.com',
            phone: phone || '+15551234567'
          }
        );

        return res.status(200).json({
          testType: 'template',
          result: result
        });
      }

      return res.status(400).json({
        error: 'Invalid testType. Use: email, sms, dual, or template'
      });
    }

    return res.status(400).json({ error: 'Invalid request method' });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};
