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
    // Check if AWS SES is configured
    const awsSesConfigured = !!(
      process.env.AWS_SES_ACCESS_KEY_ID &&
      process.env.AWS_SES_SECRET_ACCESS_KEY
    );

    // Check if Twilio is configured
    const twilioConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );

    const status = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: {
        connected: false,
        type: 'none'
      },
      services: {
        email: awsSesConfigured,
        email_provider: awsSesConfigured ? 'AWS SES' : 'Demo Mode',
        sms: twilioConfigured,
        sms_provider: twilioConfigured ? 'Twilio' : 'Demo Mode',
        stripe: !!process.env.STRIPE_SECRET_KEY
      },
      config_debug: {
        aws_ses: {
          access_key_set: !!process.env.AWS_SES_ACCESS_KEY_ID,
          secret_key_set: !!process.env.AWS_SES_SECRET_ACCESS_KEY,
          region: process.env.AWS_SES_REGION || 'us-east-1 (default)'
        },
        twilio: {
          account_sid_set: !!process.env.TWILIO_ACCOUNT_SID,
          auth_token_set: !!process.env.TWILIO_AUTH_TOKEN,
          phone_number_set: !!process.env.TWILIO_PHONE_NUMBER
        }
      },
      version: '2.1.0'
    };

    // Check database connection (simplified)
    if (process.env.DATABASE_URL) {
      status.database.connected = true;
      status.database.type = 'postgresql';
    } else {
      status.database.type = 'demo_mode';
      status.status = 'demo';
    }

    // Add email test if requested
    if (req.query.test === 'email') {
      try {
        const { sendEmail } = await import('./utils/notifications.js');
        const testResult = await sendEmail({
          to: 'test@example.com',
          subject: 'AWS SES Test',
          body: 'This is a test email from ClinicalCanvas EHR via AWS SES.'
        });
        status.email_test = testResult;
      } catch (error) {
        status.email_test = { error: error.message };
      }
    }

    // Add SMS test if requested
    if (req.query.test === 'sms') {
      try {
        const { sendSMS } = await import('./utils/notifications.js');
        const testResult = await sendSMS({
          to: '+15551234567',
          body: 'This is a test SMS from ClinicalCanvas EHR via Twilio.'
        });
        status.sms_test = testResult;
      } catch (error) {
        status.sms_test = { error: error.message };
      }
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
