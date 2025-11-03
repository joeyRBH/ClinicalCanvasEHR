// Email and SMS Notification Utility
// Handles SendGrid (email) and Twilio (SMS) integration

const { Pool } = require('pg');

// Database connection pool
let pool;
function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
        });
    }
    return pool;
}

/**
 * Fetch practice settings from database
 * @param {String} userId - User ID to fetch settings for
 * @returns {Promise<Object>} - Practice settings object
 */
async function getPracticeSettings(userId) {
    if (!userId) {
        console.log('⚠️  No user ID provided, using default practice settings');
        return {};
    }

    try {
        const db = getPool();
        const result = await db.query(
            'SELECT * FROM practice_settings WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            console.log('⚠️  No practice settings found for user:', userId);
            return {};
        }

        return result.rows[0];
    } catch (error) {
        console.error('❌ Error fetching practice settings:', error.message);
        return {};
    }
}

/**
 * Create HTML email template with practice branding
 * @param {String} bodyContent - Main email content
 * @param {Object} practiceSettings - Practice information
 * @returns {String} - HTML email
 */
function createHTMLEmail(bodyContent, practiceSettings = {}) {
    const practiceName = practiceSettings.practice_name || 'Your Practice';
    const practicePhone = practiceSettings.practice_phone || '';
    const practiceEmail = practiceSettings.practice_email || '';
    const practiceWebsite = practiceSettings.practice_website || '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background-color: #2c3e50;
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .content p {
            margin: 0 0 15px 0;
        }
        .info-block {
            background-color: #f8f9fa;
            border-left: 4px solid #2c3e50;
            padding: 15px;
            margin: 20px 0;
        }
        .contact-info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #666;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e0e0e0;
        }
        .footer a {
            color: #3498db;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${practiceName}</h1>
        </div>
        <div class="content">
            ${bodyContent}

            <div class="contact-info">
                <strong>Contact Information:</strong><br>
                ${practicePhone ? `Phone: ${practicePhone}<br>` : ''}
                ${practiceEmail ? `Email: ${practiceEmail}<br>` : ''}
                ${practiceWebsite ? `Website: ${practiceWebsite}` : ''}
            </div>
        </div>
        <div class="footer">
            <p>Powered by <a href="https://clinicalcanvas.app">ClinicalCanvas</a> - HIPAA Compliant Messenger</p>
            <p>This is a secure, encrypted communication from ${practiceName}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Send email via SendGrid
 * @param {Object} emailData - { to, subject, body, html, from, fromName, practiceSettings }
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function sendEmail(emailData) {
    const {
        to,
        subject,
        body,
        html,
        from = process.env.SENDGRID_FROM_EMAIL || 'noreply@clinicalcanvas.app',
        fromName,
        practiceSettings = {}
    } = emailData;

    // Use practice name if available, otherwise use environment variable or default
    const senderName = fromName || practiceSettings.practice_name || process.env.SENDGRID_FROM_NAME || 'ClinicalCanvas EHR';

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
        console.log('📧 EMAIL (Demo Mode):', {
            to,
            subject,
            from,
            fromName: senderName,
            body: body.substring(0, 100) + '...'
        });
        return {
            success: true,
            message: 'Email logged (demo mode - SendGrid not configured)',
            demo: true
        };
    }

    try {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        // If HTML is not provided, create it from body with practice branding
        const emailHTML = html || createHTMLEmail(
            body.replace(/\n/g, '<br>'),
            practiceSettings
        );

        const msg = {
            to,
            from: {
                email: from,
                name: senderName
            },
            subject,
            text: body,
            html: emailHTML
        };

        const result = await sgMail.default.send(msg);

        console.log('✅ Email sent via SendGrid to:', to);
        console.log('   Status Code:', result[0].statusCode);

        return {
            success: true,
            message: 'Email sent successfully via SendGrid',
            provider: 'SendGrid'
        };
    } catch (error) {
        console.error('❌ SendGrid email send failed:', error.message);
        return {
            success: false,
            message: error.message,
            provider: 'SendGrid'
        };
    }
}

/**
 * Send SMS via Twilio
 * @param {Object} smsData - { to, body }
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function sendSMS(smsData) {
    const { to, body } = smsData;

    // Check if Twilio is configured (now using Messaging Service SID)
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log('📱 SMS (Demo Mode):', {
            to,
            body: body.substring(0, 100) + '...'
        });
        return {
            success: true,
            message: 'SMS logged (demo mode - Twilio not configured)',
            demo: true
        };
    }

    try {
        const twilio = require('twilio');
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Use Messaging Service SID instead of from phone number
        const messageParams = {
            body: body,
            to: to
        };

        // Use Messaging Service SID if available, otherwise fall back to phone number
        if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
            messageParams.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
            console.log('📱 Using Twilio Messaging Service:', process.env.TWILIO_MESSAGING_SERVICE_SID);
        } else if (process.env.TWILIO_PHONE_NUMBER) {
            messageParams.from = process.env.TWILIO_PHONE_NUMBER;
            console.log('📱 Using Twilio Phone Number:', process.env.TWILIO_PHONE_NUMBER);
        } else {
            throw new Error('Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is configured');
        }

        const message = await client.messages.create(messageParams);

        console.log('✅ SMS sent successfully to:', to);
        console.log('   Message SID:', message.sid);
        console.log('   Status:', message.status);

        return {
            success: true,
            message: 'SMS sent successfully',
            messageId: message.sid,
            status: message.status
        };
    } catch (error) {
        console.error('❌ SMS send failed:', error.message);
        console.error('   Error code:', error.code);
        console.error('   More info:', error.moreInfo);
        return {
            success: false,
            message: error.message,
            errorCode: error.code
        };
    }
}

/**
 * Send both email and SMS (dual notification)
 * @param {Object} notificationData - { to, email, phone, subject, body, html, practiceSettings }
 * @returns {Promise<Object>} - { email: {...}, sms: {...} }
 */
async function sendDualNotification(notificationData) {
    const { to, email, phone, subject, body, html, practiceSettings = {} } = notificationData;

    const results = {
        email: { success: false, message: 'Not sent' },
        sms: { success: false, message: 'Not sent' }
    };

    // Send email if email address provided
    if (email) {
        results.email = await sendEmail({
            to: email,
            subject,
            body,
            html,
            practiceSettings
        });
    }

    // Send SMS if phone number provided
    if (phone) {
        results.sms = await sendSMS({
            to: phone,
            body: `${subject}\n\n${body}`
        });
    }

    return results;
}

/**
 * Notification templates
 */
const templates = {
    paymentReceived: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';
        const { invoice } = data;

        return {
            subject: `Payment Received - Invoice ${invoice.invoice_number}`,
            body: `
Dear ${invoice.client_name},

We have received your payment of $${parseFloat(invoice.total_amount).toFixed(2)} for invoice ${invoice.invoice_number}.

Thank you for your payment!

If you have any questions, please don't hesitate to contact us.

Best regards,
${practiceName}
            `.trim(),
            html: createHTMLEmail(`
                <p>Dear ${invoice.client_name},</p>
                <p>We have received your payment of <strong>$${parseFloat(invoice.total_amount).toFixed(2)}</strong> for invoice ${invoice.invoice_number}.</p>
                <div class="info-block">
                    <strong>Payment Confirmed</strong><br>
                    Invoice: ${invoice.invoice_number}<br>
                    Amount: $${parseFloat(invoice.total_amount).toFixed(2)}
                </div>
                <p>Thank you for your payment!</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br>${practiceName}</p>
            `, practiceSettings)
        };
    },

    paymentFailed: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';
        const { invoice, error } = data;

        return {
            subject: `Payment Failed - Invoice ${invoice.invoice_number}`,
            body: `
Dear ${invoice.client_name},

We were unable to process your payment for invoice ${invoice.invoice_number}.
Error: ${error}

Please update your payment method or contact us to resolve this issue.

Best regards,
${practiceName}
            `.trim(),
            html: createHTMLEmail(`
                <p>Dear ${invoice.client_name},</p>
                <p>We were unable to process your payment for invoice ${invoice.invoice_number}.</p>
                <div class="info-block">
                    <strong>Payment Failed</strong><br>
                    Invoice: ${invoice.invoice_number}<br>
                    Error: ${error}
                </div>
                <p>Please update your payment method or contact us to resolve this issue.</p>
                <p>Best regards,<br>${practiceName}</p>
            `, practiceSettings)
        };
    },

    refundProcessed: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';
        const { invoice, refundAmount } = data;

        return {
            subject: `Refund Processed - Invoice ${invoice.invoice_number}`,
            body: `
Dear ${invoice.client_name},

A refund of $${parseFloat(refundAmount).toFixed(2)} has been processed for invoice ${invoice.invoice_number}.

The refund will appear on your account within 5-10 business days.

If you have any questions, please contact us.

Best regards,
${practiceName}
            `.trim(),
            html: createHTMLEmail(`
                <p>Dear ${invoice.client_name},</p>
                <p>A refund has been processed for invoice ${invoice.invoice_number}.</p>
                <div class="info-block">
                    <strong>Refund Processed</strong><br>
                    Invoice: ${invoice.invoice_number}<br>
                    Refund Amount: $${parseFloat(refundAmount).toFixed(2)}
                </div>
                <p>The refund will appear on your account within 5-10 business days.</p>
                <p>If you have any questions, please contact us.</p>
                <p>Best regards,<br>${practiceName}</p>
            `, practiceSettings)
        };
    },

    invoiceCreated: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';
        const { invoice } = data;

        return {
            subject: `New Invoice - ${invoice.invoice_number}`,
            body: `
Dear ${invoice.client_name},

A new invoice has been created for you:

Invoice Number: ${invoice.invoice_number}
Amount: $${parseFloat(invoice.total_amount).toFixed(2)}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Please log in to view and pay your invoice.

Best regards,
${practiceName}
            `.trim(),
            html: createHTMLEmail(`
                <p>Dear ${invoice.client_name},</p>
                <p>A new invoice has been created for you:</p>
                <div class="info-block">
                    <strong>Invoice Details</strong><br>
                    Invoice Number: ${invoice.invoice_number}<br>
                    Amount: $${parseFloat(invoice.total_amount).toFixed(2)}<br>
                    Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
                </div>
                <p>Please log in to view and pay your invoice.</p>
                <p>Best regards,<br>${practiceName}</p>
            `, practiceSettings)
        };
    },

    autopayEnabled: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';
        const { client } = data;

        return {
            subject: `Autopay Enabled`,
            body: `
Dear ${client.name},

Autopay has been enabled for your account. Future invoices will be automatically charged to your default payment method.

You can manage your autopay settings at any time by logging into your account.

Best regards,
${practiceName}
            `.trim(),
            html: createHTMLEmail(`
                <p>Dear ${client.name},</p>
                <p>Autopay has been enabled for your account.</p>
                <div class="info-block">
                    <strong>Autopay Enabled</strong><br>
                    Future invoices will be automatically charged to your default payment method.
                </div>
                <p>You can manage your autopay settings at any time by logging into your account.</p>
                <p>Best regards,<br>${practiceName}</p>
            `, practiceSettings)
        };
    },

    autopayFailed: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';
        const { invoice, error } = data;

        return {
            subject: `Autopay Failed - Invoice ${invoice.invoice_number}`,
            body: `
Dear ${invoice.client_name},

We were unable to process your automatic payment for invoice ${invoice.invoice_number}.
Error: ${error}

Please update your payment method or contact us to resolve this issue.

Best regards,
${practiceName}
            `.trim(),
            html: createHTMLEmail(`
                <p>Dear ${invoice.client_name},</p>
                <p>We were unable to process your automatic payment for invoice ${invoice.invoice_number}.</p>
                <div class="info-block">
                    <strong>Autopay Failed</strong><br>
                    Invoice: ${invoice.invoice_number}<br>
                    Error: ${error}
                </div>
                <p>Please update your payment method or contact us to resolve this issue.</p>
                <p>Best regards,<br>${practiceName}</p>
            `, practiceSettings)
        };
    },

    appointmentReminder: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';
        const { appointment } = data;
        const isTelehealth = appointment.modality === 'telehealth';

        // Build the body text
        let bodyText = `
Dear ${appointment.client_name},

This is a reminder that you have an appointment scheduled for:

Date: ${new Date(appointment.appointment_date).toLocaleDateString()}
Time: ${appointment.appointment_time}
Duration: ${appointment.duration} minutes
Type: ${appointment.type}
Modality: ${isTelehealth ? 'Telehealth (Video)' : 'In-Person'}
`;

        if (isTelehealth && appointment.telehealth_link) {
            bodyText += `\nJoin your video session here:\n${appointment.telehealth_link}\n\nPlease join 5 minutes early to test your connection.`;
        } else if (!isTelehealth) {
            bodyText += `\nPlease arrive 10 minutes early.`;
        }

        bodyText += `\n\nBest regards,\n${practiceName}`;

        // Build the HTML
        let htmlContent = `
                <p>Dear ${appointment.client_name},</p>
                <p>This is a reminder that you have an appointment scheduled for:</p>
                <div class="info-block">
                    <strong>Appointment Details</strong><br>
                    Date: ${new Date(appointment.appointment_date).toLocaleDateString()}<br>
                    Time: ${appointment.appointment_time}<br>
                    Duration: ${appointment.duration} minutes<br>
                    Type: ${appointment.type}<br>
                    Modality: ${isTelehealth ? '<strong>Telehealth (Video)</strong>' : 'In-Person'}
                </div>
`;

        if (isTelehealth && appointment.telehealth_link) {
            htmlContent += `
                <div class="info-block" style="background-color: #e8f5e9; border-left-color: #4caf50;">
                    <strong>🎥 Join Video Session</strong><br>
                    <a href="${appointment.telehealth_link}" style="color: #2c3e50; font-weight: bold; text-decoration: underline;">${appointment.telehealth_link}</a>
                </div>
                <p><strong>Please join 5 minutes early to test your connection.</strong></p>
`;
        } else if (!isTelehealth) {
            htmlContent += `<p>Please arrive 10 minutes early.</p>`;
        }

        htmlContent += `<p>Best regards,<br>${practiceName}</p>`;

        return {
            subject: `Appointment Reminder - ${new Date(appointment.appointment_date).toLocaleDateString()}${isTelehealth ? ' (Telehealth)' : ''}`,
            body: bodyText.trim(),
            html: createHTMLEmail(htmlContent, practiceSettings)
        };
    },

    documentAssigned: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';
        const { client, document } = data;

        return {
            subject: `New Document to Complete`,
            body: `
Dear ${client.name},

A new document has been assigned to you: ${document.template_name}

To complete this document securely, please visit:
https://clinicalcanvas.vercel.app/client-portal

Your secure access code: ${document.auth_code}

This code will expire in 7 days for security purposes.

For your protection:
- Do not share this code with anyone
- Access the portal only from a secure device
- Contact us if you did not request this document

Best regards,
${practiceName}
            `.trim(),
            html: createHTMLEmail(`
                <p>Dear ${client.name},</p>
                <p>A new document has been assigned to you: <strong>${document.template_name}</strong></p>
                <div class="info-block">
                    <strong>Secure Access Information</strong><br>
                    Portal: <a href="https://clinicalcanvas.vercel.app/client-portal">https://clinicalcanvas.vercel.app/client-portal</a><br>
                    Access Code: <strong>${document.auth_code}</strong><br>
                    Expires: 7 days
                </div>
                <p><strong>For your protection:</strong></p>
                <ul>
                    <li>Do not share this code with anyone</li>
                    <li>Access the portal only from a secure device</li>
                    <li>Contact us if you did not request this document</li>
                </ul>
                <p>Best regards,<br>${practiceName}</p>
            `, practiceSettings)
        };
    }
};

/**
 * Send notification using template
 * @param {String} templateName - Template name from templates object
 * @param {Object} data - Data for template
 * @param {Object} contact - { email, phone }
 * @param {Object} practiceSettings - Practice information for branding
 * @returns {Promise<Object>} - Notification results
 */
async function sendTemplateNotification(templateName, data, contact, practiceSettings = {}) {
    const template = templates[templateName];

    if (!template) {
        return {
            success: false,
            message: `Template "${templateName}" not found`
        };
    }

    const { subject, body, html } = template(data, practiceSettings);

    return await sendDualNotification({
        to: contact.email || contact.phone,
        email: contact.email,
        phone: contact.phone,
        subject,
        body,
        html,
        practiceSettings
    });
}

module.exports = {
    sendEmail,
    sendSMS,
    sendDualNotification,
    sendTemplateNotification,
    createHTMLEmail,
    getPracticeSettings,
    templates
};
