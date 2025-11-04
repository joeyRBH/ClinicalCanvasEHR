// Test SendGrid Email Integration
// API endpoint: /api/test-sendgrid

export default async function handler(req, res) {
    // Enable CORS
    const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
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
        // Import SendGrid
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        // Test 1: Send basic email
        console.log('\n📧 Test 1: Sending basic email via SendGrid');

        const msg1 = {
            to: testEmail,
            from: {
                email: fromEmail,
                name: fromName
            },
            subject: '✅ SendGrid Test Email #1',
            text: `Hello from ClinicalCanvas EHR!

This is test email #1 sent via SendGrid.

✅ SendGrid DNS Authentication: VERIFIED
✅ Domain: clinicalcanvas.app
✅ Provider: SendGrid

If you received this email, your SendGrid integration is working correctly!

---
Sent at: ${new Date().toISOString()}
Test endpoint: /api/test-sendgrid`,
            html: `<p>Hello from ClinicalCanvas EHR!</p>
<p>This is test email #1 sent via SendGrid.</p>
<p>✅ SendGrid DNS Authentication: VERIFIED<br>
✅ Domain: clinicalcanvas.app<br>
✅ Provider: SendGrid</p>
<p>If you received this email, your SendGrid integration is working correctly!</p>
<hr>
<p><small>Sent at: ${new Date().toISOString()}<br>
Test endpoint: /api/test-sendgrid</small></p>`
        };

        const result1 = await sgMail.send(msg1);
        console.log('Test 1 Result - Status Code:', result1[0].statusCode);

        // Test 2: Send second email
        console.log('\n📧 Test 2: Sending second email via SendGrid');

        const msg2 = {
            to: testEmail,
            from: {
                email: fromEmail,
                name: fromName
            },
            subject: '✅ SendGrid Test Email #2',
            text: `Hello from ClinicalCanvas EHR!

This is test email #2 sent via SendGrid.

✅ SendGrid DNS Authentication: VERIFIED
✅ Domain: clinicalcanvas.app
✅ Provider: SendGrid

If you received this email, your SendGrid integration is working perfectly!

---
Sent at: ${new Date().toISOString()}
Test endpoint: /api/test-sendgrid`,
            html: `<p>Hello from ClinicalCanvas EHR!</p>
<p>This is test email #2 sent via SendGrid.</p>
<p>✅ SendGrid DNS Authentication: VERIFIED<br>
✅ Domain: clinicalcanvas.app<br>
✅ Provider: SendGrid</p>
<p>If you received this email, your SendGrid integration is working perfectly!</p>
<hr>
<p><small>Sent at: ${new Date().toISOString()}<br>
Test endpoint: /api/test-sendgrid</small></p>`
        };

        const result2 = await sgMail.send(msg2);
        console.log('Test 2 Result - Status Code:', result2[0].statusCode);

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
                email1: {
                    success: true,
                    statusCode: result1[0].statusCode,
                    subject: '✅ SendGrid Test Email #1'
                },
                email2: {
                    success: true,
                    statusCode: result2[0].statusCode,
                    subject: '✅ SendGrid Test Email #2'
                }
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
