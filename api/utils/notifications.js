// Email and SMS Notification Utility
// Handles AWS SES (email) and Twilio (SMS) integration

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

/**
 * Send email via AWS SES
 * @param {Object} emailData - { to, subject, body, from }
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function sendEmail(emailData) {
    const { to, subject, body, from = 'notifications@clinicalcanvas.app' } = emailData;

    // Check if AWS SES is configured
    if (!process.env.AWS_SES_ACCESS_KEY_ID || !process.env.AWS_SES_SECRET_ACCESS_KEY) {
        console.log('📧 EMAIL (Demo Mode):', {
            to,
            subject,
            from,
            body: body.substring(0, 100) + '...'
        });
        return {
            success: true,
            message: 'Email logged (demo mode - AWS SES not configured)',
            demo: true
        };
    }

    try {
        // Configure AWS SES client
        const sesClient = new SESClient({
            region: process.env.AWS_SES_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY
            }
        });

        // Create email parameters
        const params = {
            Source: from,
            Destination: {
                ToAddresses: [to]
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8'
                },
                Body: {
                    Text: {
                        Data: body,
                        Charset: 'UTF-8'
                    },
                    Html: {
                        Data: body.replace(/\n/g, '<br>'),
                        Charset: 'UTF-8'
                    }
                }
            }
        };

        // Send email
        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);

        console.log('✅ Email sent successfully to:', to);
        console.log('   Message ID:', result.MessageId);

        return {
            success: true,
            message: 'Email sent successfully',
            messageId: result.MessageId
        };
    } catch (error) {
        console.error('❌ Email send failed:', error.message);
        return {
            success: false,
            message: error.message
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

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
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

        const message = await client.messages.create({
            body: body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });

        console.log('✅ SMS sent successfully to:', to);
        console.log('   Message SID:', message.sid);

        return {
            success: true,
            message: 'SMS sent successfully',
            messageId: message.sid
        };
    } catch (error) {
        console.error('❌ SMS send failed:', error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Send both email and SMS (dual notification)
 * @param {Object} notificationData - { to, email, phone, subject, body }
 * @returns {Promise<Object>} - { email: {...}, sms: {...} }
 */
async function sendDualNotification(notificationData) {
    const { to, email, phone, subject, body } = notificationData;

    const results = {
        email: { success: false, message: 'Not sent' },
        sms: { success: false, message: 'Not sent' }
    };

    // Send email if email address provided
    if (email) {
        results.email = await sendEmail({
            to: email,
            subject,
            body
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
    paymentReceived: (invoice) => ({
        subject: `Payment Received - Invoice ${invoice.invoice_number}`,
        body: `
Dear ${invoice.client_name},

We have received your payment of $${parseFloat(invoice.total_amount).toFixed(2)} for invoice ${invoice.invoice_number}.

Thank you for your payment!

If you have any questions, please don't hesitate to contact us.

Best regards,
ClinicalCanvas EHR
        `.trim()
    }),

    paymentFailed: (invoice, error) => ({
        subject: `Payment Failed - Invoice ${invoice.invoice_number}`,
        body: `
Dear ${invoice.client_name},

We were unable to process your payment for invoice ${invoice.invoice_number}.
Error: ${error}

Please update your payment method or contact us to resolve this issue.

Best regards,
ClinicalCanvas EHR
        `.trim()
    }),

    refundProcessed: (invoice, refundAmount) => ({
        subject: `Refund Processed - Invoice ${invoice.invoice_number}`,
        body: `
Dear ${invoice.client_name},

A refund of $${parseFloat(refundAmount).toFixed(2)} has been processed for invoice ${invoice.invoice_number}.

The refund will appear on your account within 5-10 business days.

If you have any questions, please contact us.

Best regards,
ClinicalCanvas EHR
        `.trim()
    }),

    invoiceCreated: (invoice) => ({
        subject: `New Invoice - ${invoice.invoice_number}`,
        body: `
Dear ${invoice.client_name},

A new invoice has been created for you:

Invoice Number: ${invoice.invoice_number}
Amount: $${parseFloat(invoice.total_amount).toFixed(2)}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Please log in to view and pay your invoice.

Best regards,
ClinicalCanvas EHR
        `.trim()
    }),

    autopayEnabled: (client) => ({
        subject: `Autopay Enabled`,
        body: `
Dear ${client.name},

Autopay has been enabled for your account. Future invoices will be automatically charged to your default payment method.

You can manage your autopay settings at any time by logging into your account.

Best regards,
ClinicalCanvas EHR
        `.trim()
    }),

    autopayFailed: (invoice, error) => ({
        subject: `Autopay Failed - Invoice ${invoice.invoice_number}`,
        body: `
Dear ${invoice.client_name},

We were unable to process your automatic payment for invoice ${invoice.invoice_number}.
Error: ${error}

Please update your payment method or contact us to resolve this issue.

Best regards,
ClinicalCanvas EHR
        `.trim()
    }),

    appointmentReminder: (appointment) => ({
        subject: `Appointment Reminder - ${new Date(appointment.appointment_date).toLocaleDateString()}`,
        body: `
Dear ${appointment.client_name},

This is a reminder that you have an appointment scheduled for:

Date: ${new Date(appointment.appointment_date).toLocaleDateString()}
Time: ${appointment.appointment_time}
Duration: ${appointment.duration} minutes
Type: ${appointment.type}

Please arrive 10 minutes early.

Best regards,
ClinicalCanvas EHR
        `.trim()
    }),

    documentAssigned: (client, document) => ({
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
ClinicalCanvas EHR
        `.trim()
    })
};

/**
 * Send notification using template
 * @param {String} templateName - Template name from templates object
 * @param {Object} data - Data for template
 * @param {Object} contact - { email, phone }
 * @returns {Promise<Object>} - Notification results
 */
async function sendTemplateNotification(templateName, data, contact) {
    const template = templates[templateName];

    if (!template) {
        return {
            success: false,
            message: `Template "${templateName}" not found`
        };
    }

    const { subject, body } = template(data);

    return await sendDualNotification({
        to: contact.email || contact.phone,
        email: contact.email,
        phone: contact.phone,
        subject,
        body
    });
}

module.exports = {
    sendEmail,
    sendSMS,
    sendDualNotification,
    sendTemplateNotification,
    templates
};
