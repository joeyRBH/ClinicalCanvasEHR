// Test Environment Variables
// Debug endpoint to check what environment variables are available

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

  // Check what environment variables are available
  const envVars = {
    BREVO_API_KEY: !!process.env.BREVO_API_KEY,
    BREVO_API_KEY_LENGTH: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.length : 0,
    BREVO_API_KEY_PREFIX: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 10) : 'not_set',
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: !!process.env.TWILIO_PHONE_NUMBER,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV
  };

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    environment_variables: envVars,
    note: "This endpoint helps debug environment variable issues"
  });
}
