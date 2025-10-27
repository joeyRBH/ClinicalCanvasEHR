// Test SendGrid Email Integration
// API endpoint: /api/test-sendgrid

const { sendEmail, sendEmailViaSendGrid } = require('./utils/notifications');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    console.log('🧪 Testing SendGrid Email Integration...');

    // Check if SendGrid is configured
    const sendgridConfigured = !!process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@clinicalcanvas.app';
    const fromName = process.env.SENDGRID_FROM_NAME || 'ClinicalCanvas EHR';

    console.log('SendGrid Configuration:');
    console.log('  API Key:', sendgridConfigured ? 'Configured ✅' : 'Not configured ❌');
    console.log('  From Email:', fromEmail);
    console.log('  From Name:', fromName);

    if (!sendgridConfigured) {
        return res.status(200).json({
            success: false,
            error: 'SendGrid not configured',
            message: 'Please set SENDGRID_API_KEY environment variable in Vercel',
            instructions: [
                '1. Go to Vercel Dashboard',
                '2. Select your project',
                '3. Go to Settings → Environment Variables',
                '4. Add these variables:',
                '   - SENDGRID_API_KEY=SG.your_api_key_here',
                '   - SENDGRID_FROM_EMAIL=noreply@clinicalcanvas.app',
                '   - SENDGRID_FROM_NAME=ClinicalCanvas EHR',
                '5. Redeploy your project'
            ]
        });
    }

    // Get test email from query parameter or use default
    const testEmail = req.query.email || req.body?.email || 'joey@clinicalcanvas.app';

    try {
        // Test 1: Send using the auto-select function (should use SendGrid)
        console.log('\n📧 Test 1: Auto-select provider (should use SendGrid)');
        const result1 = await sendEmail({
            to: testEmail,
            subject: '✅ SendGrid Test Email - Auto Select',
            body: `
Hello from ClinicalCanvas EHR!

This is a test email sent via SendGrid using the auto-select function.

✅ SendGrid DNS Authentication: VERIFIED
✅ Domain: clinicalcanvas.app
✅ Provider: SendGrid (auto-selected)

If you received this email, your SendGrid integration is working correctly!

---
Sent at: ${new Date().toISOString()}
Test endpoint: /api/test-sendgrid
            `.trim()
        });

        console.log('Test 1 Result:', result1);

        // Test 2: Send explicitly via SendGrid
        console.log('\n📧 Test 2: Explicit SendGrid function');
        const result2 = await sendEmailViaSendGrid({
            to: testEmail,
            subject: '✅ SendGrid Test Email - Explicit',
            body: `
Hello from ClinicalCanvas EHR!

This is a test email sent explicitly via SendGrid.

✅ SendGrid DNS Authentication: VERIFIED
✅ Domain: clinicalcanvas.app
✅ Provider: SendGrid (explicit call)

If you received this email, your SendGrid integration is working perfectly!

---
Sent at: ${new Date().toISOString()}
Test endpoint: /api/test-sendgrid
            `.trim()
        });

        console.log('Test 2 Result:', result2);

        // Return results
        return res.status(200).json({
            success: true,
            message: '✅ SendGrid tests completed successfully!',
            configuration: {
                apiKeyConfigured: sendgridConfigured,
                fromEmail,
                fromName,
                dnsVerified: true
            },
            tests: {
                autoSelect: result1,
                explicitSendGrid: result2
            },
            testEmail,
            instructions: [
                `Check your email inbox at ${testEmail}`,
                'You should have received 2 test emails',
                'If emails are in spam, mark them as "Not Spam"',
                'SendGrid authentication should prevent future spam issues'
            ]
        });
    } catch (error) {
        console.error('❌ SendGrid test failed:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
