const { sendEmail, sendWelcomeEmail, sendAppointmentReminder, sendInvoiceEmail } = require('./brevo-email');

/**
 * API endpoint to send emails via Brevo
 * Handles various email types: general, welcome, appointment reminders, invoices
 */
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { emailType, emailData } = req.body;

        if (!emailType || !emailData) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: emailType and emailData'
            });
        }

        let result;

        // Route to appropriate email function based on type
        switch (emailType) {
            case 'welcome':
                result = await sendWelcomeEmail(emailData);
                break;
                
            case 'appointment_reminder':
                result = await sendAppointmentReminder(emailData);
                break;
                
            case 'invoice':
                result = await sendInvoiceEmail(emailData);
                break;
                
            case 'general':
                result = await sendEmail(emailData);
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: `Invalid emailType: ${emailType}. Supported types: welcome, appointment_reminder, invoice, general`
                });
        }

        // Return result
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Email sent successfully',
                messageId: result.messageId,
                data: result.data
            });
        } else {
            return res.status(500).json({
                success: false,
                error: result.error || 'Failed to send email'
            });
        }

    } catch (error) {
        console.error('Send email API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while sending email'
        });
    }
};
