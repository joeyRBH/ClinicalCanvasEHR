// AWS SES Email API Endpoint
const { sendEmail } = require('./utils/notifications');

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
    // Handle both direct format and wrapped format
    let emailData;
    if (req.body.emailType && req.body.emailData) {
      // Wrapped format: { emailType: 'general', emailData: {...} }
      emailData = req.body.emailData;
    } else {
      // Direct format: { to, subject, body, from }
      emailData = req.body;
    }

    const { to, subject, body, htmlContent, textContent, from } = emailData;

    // Support both body (simple) and htmlContent/textContent (rich) formats
    const emailBody = htmlContent || textContent || body;

    // Validate required fields
    if (!to || !subject || !emailBody) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, body (or htmlContent/textContent)',
        received: emailData
      });
    }

    // Send email using utility function
    const result = await sendEmail({ to, subject, body: emailBody, from });

    // Return result
    return res.status(result.success ? 200 : 500).json(result);

  } catch (error) {
    console.error('❌ Email API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
