// Simple Email Test Endpoint
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
    const { to, subject, body } = req.body;

    // Check if Brevo API key is available
    if (!process.env.BREVO_API_KEY) {
      console.log('⚠️ BREVO_API_KEY not found, using demo mode');
      return res.status(200).json({
        success: true,
        message: 'Demo mode - email would be sent to: ' + to,
        messageId: 'demo-' + Date.now(),
        demo: true,
        brevo_key_exists: false
      });
    }

    // Use Brevo API
    const SibApiV3Sdk = require('@getbrevo/brevo');
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Set API key
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    // Create email object
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = body.replace(/\n/g, '<br>');
    sendSmtpEmail.textContent = body;
    sendSmtpEmail.sender = { name: 'ClinicalCanvas EHR', email: 'noreply@clinicalcanvas.com' };
    sendSmtpEmail.to = [{ email: to }];

    // Send email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log('✅ Email sent successfully to:', to);
    console.log('📧 Message ID:', result.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      brevo_key_exists: true
    });

  } catch (error) {
    console.error('❌ Email send error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details',
      brevo_key_exists: !!process.env.BREVO_API_KEY
    });
  }
}
