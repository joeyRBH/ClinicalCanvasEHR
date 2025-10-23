const { sendEmail } = require('./brevo-email');

/**
 * Test endpoint to verify Brevo email configuration
 */
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Check if Brevo API key is configured
        if (!process.env.BREVO_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'BREVO_API_KEY not configured in environment variables'
            });
        }

        // Test email sending
        const testResult = await sendEmail({
            to: 'test@example.com', // This will fail but we can see the error
            subject: 'Test Email from ClinicalCanvas',
            htmlContent: '<h1>Test Email</h1><p>This is a test email.</p>',
            textContent: 'Test Email\n\nThis is a test email.'
        });

        return res.status(200).json({
            success: true,
            message: 'Brevo configuration test completed',
            result: testResult,
            apiKeyConfigured: !!process.env.BREVO_API_KEY,
            fromEmail: process.env.BREVO_FROM_EMAIL || 'noreply@clinicalcanvas.com',
            fromName: process.env.BREVO_FROM_NAME || 'ClinicalCanvas EHR'
        });

    } catch (error) {
        console.error('Test email error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            apiKeyConfigured: !!process.env.BREVO_API_KEY
        });
    }
};
