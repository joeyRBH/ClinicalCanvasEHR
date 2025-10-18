const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const { to, message, type = 'notification' } = req.body;

        // Validate required fields
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: to, message'
            });
        }

        // Validate phone number format (should be E.164 format)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        let phoneNumber = to.trim();

        // Add +1 if it's a 10-digit US number
        if (/^\d{10}$/.test(phoneNumber)) {
            phoneNumber = `+1${phoneNumber}`;
        }

        // Validate final format
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
            });
        }

        // Send SMS using Messaging Service (recommended) or direct phone number
        const twilioResponse = await client.messages.create({
            from: process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
            body: message
        });

        // Log success
        console.log('✅ SMS sent successfully:', {
            sid: twilioResponse.sid,
            to: phoneNumber,
            status: twilioResponse.status,
            type: type
        });

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'SMS sent successfully',
            data: {
                sid: twilioResponse.sid,
                status: twilioResponse.status,
                to: phoneNumber,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ SMS send error:', error);

        // Handle specific Twilio errors
        let errorMessage = 'Failed to send SMS';
        let statusCode = 500;

        if (error.code === 21211) {
            errorMessage = 'Invalid phone number';
            statusCode = 400;
        } else if (error.code === 21614) {
            errorMessage = 'Phone number is not SMS capable';
            statusCode = 400;
        } else if (error.code === 21408) {
            errorMessage = 'Permission denied to send to this number';
            statusCode = 403;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
};

