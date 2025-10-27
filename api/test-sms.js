// Test Twilio SMS Integration
// API endpoint: /api/test-sms

const { sendSMS } = require('./utils/notifications');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    console.log('🧪 Testing Twilio SMS Integration...');

    // Check if Twilio is configured
    const twilioConfigured = !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
    );

    console.log('Twilio Configuration:');
    console.log('  Account SID:', process.env.TWILIO_ACCOUNT_SID ? 'Configured ✅' : 'Not configured ❌');
    console.log('  Auth Token:', process.env.TWILIO_AUTH_TOKEN ? 'Configured ✅' : 'Not configured ❌');
    console.log('  Phone Number:', process.env.TWILIO_PHONE_NUMBER || 'Not configured ❌');

    if (!twilioConfigured) {
        return res.status(200).json({
            success: false,
            error: 'Twilio not configured',
            message: 'Please set Twilio environment variables in Vercel',
            configuration: {
                accountSidConfigured: !!process.env.TWILIO_ACCOUNT_SID,
                authTokenConfigured: !!process.env.TWILIO_AUTH_TOKEN,
                phoneNumberConfigured: !!process.env.TWILIO_PHONE_NUMBER
            },
            instructions: [
                '1. Go to Vercel Dashboard',
                '2. Select your project',
                '3. Go to Settings → Environment Variables',
                '4. Add these variables:',
                '   - TWILIO_ACCOUNT_SID=ACxxxxxxxxxx',
                '   - TWILIO_AUTH_TOKEN=xxxxxxxxxx',
                '   - TWILIO_PHONE_NUMBER=+1234567890',
                '5. Redeploy your project'
            ]
        });
    }

    // Get test phone number from query parameter or use default
    const testPhone = req.query.phone || req.body?.phone;

    if (!testPhone) {
        return res.status(400).json({
            success: false,
            error: 'Missing phone number',
            message: 'Please provide a phone number to test',
            usage: 'GET /api/test-sms?phone=+1234567890',
            configuration: {
                accountSidConfigured: true,
                authTokenConfigured: true,
                phoneNumberConfigured: true,
                fromNumber: process.env.TWILIO_PHONE_NUMBER
            }
        });
    }

    try {
        // Send test SMS
        console.log('📱 Sending test SMS via Twilio');

        const timestamp = new Date().toISOString();
        const result = await sendSMS({
            to: testPhone,
            body: `Test SMS from ClinicalCanvas EHR via Twilio. Twilio configured correctly. Phone: ${process.env.TWILIO_PHONE_NUMBER}. Sent at: ${timestamp}`
        });

        console.log('Test Result:', result);

        // Return results
        return res.status(200).json({
            success: result.success,
            message: result.success
                ? '✅ Twilio SMS test completed successfully!'
                : '❌ SMS test failed',
            configuration: {
                accountSidConfigured: true,
                authTokenConfigured: true,
                phoneNumberConfigured: true,
                fromNumber: process.env.TWILIO_PHONE_NUMBER
            },
            test: {
                to: testPhone,
                from: process.env.TWILIO_PHONE_NUMBER,
                result: result,
                demo: result.demo || false
            },
            instructions: result.success
                ? [
                    `Check your phone at ${testPhone}`,
                    'You should have received a test SMS',
                    'Reply STOP to opt out of future messages'
                ]
                : [
                    'SMS test failed',
                    'Check Twilio credentials are correct',
                    'Verify phone number format: +1234567890',
                    'Check Twilio account status and balance'
                ]
        });
    } catch (error) {
        console.error('❌ Twilio test failed:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
