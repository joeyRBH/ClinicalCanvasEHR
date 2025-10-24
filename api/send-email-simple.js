// Simple Email API using direct HTTP requests to Brevo
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
    const { to, subject, body, from = 'noreply@clinicalcanvas.com' } = req.body;

    // Check if Brevo API key is available
    if (!process.env.BREVO_API_KEY) {
      console.log('⚠️ BREVO_API_KEY not found, using demo mode');
      return res.status(200).json({
        success: true,
        message: 'Demo mode - email would be sent to: ' + to,
        messageId: 'demo-' + Date.now(),
        demo: true
      });
    }

    // Use direct HTTP request to Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/send/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'ClinicalCanvas EHR',
          email: from
        },
        to: [
          {
            email: to
          }
        ],
        subject: subject,
        htmlContent: body.replace(/\n/g, '<br>'),
        textContent: body
      })
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      throw new Error(`Brevo API error: ${brevoResponse.status} - ${errorData}`);
    }

    const result = await brevoResponse.json();
    
    console.log('✅ Email sent successfully to:', to);
    console.log('📧 Message ID:', result.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
      data: result
    });

  } catch (error) {
    console.error('❌ Email send error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack || 'No additional details'
    });
  }
};
