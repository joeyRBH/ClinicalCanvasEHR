// Email and SMS Notification Utility
// Handles SendGrid (email) and Brevo (email/SMS) integration

/**
 * Send email via SendGrid
 * @param {Object} emailData - { to, subject, body, from }
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function sendEmailViaSendGrid(emailData) {
    const { to, subject, body, from = process.env.SENDGRID_FROM_EMAIL || 'noreply@clinicalcanvas.app' } = emailData;

    try {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to,
            from: {
                email: from,
                name: process.env.SENDGRID_FROM_NAME || 'ClinicalCanvas EHR'
            },
            subject,
            text: body,
            html: body.replace(/\n/g, '<br>')
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
 * Send email via Brevo (formerly Sendinblue)
 * @param {Object} emailData - { to, subject, body, from }
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function sendEmailViaBrevo(emailData) {
    const { to, subject, body, from = 'noreply@clinicalcanvas.com' } = emailData;

    try {
        // Use direct HTTP request to Brevo API
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
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
        console.log('✅ Email sent via Brevo to:', to);
        console.log('   Message ID:', result.messageId);

        return {
            success: true,
            message: 'Email sent successfully via Brevo',
            messageId: result.messageId,
            provider: 'Brevo'
        };
    } catch (error) {
        console.error('❌ Brevo email send failed:', error.message);
        return {
            success: false,
            message: error.message,
            provider: 'Brevo'
        };
    }
}

/**
 * Send email (auto-selects provider based on environment variables)
 * Priority: SendGrid > Brevo > Demo Mode
 * @param {Object} emailData - { to, subject, body, from }
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function sendEmail(emailData) {
    const { to, subject, body, from } = emailData;

    // Priority 1: SendGrid (if configured)
    if (process.env.SENDGRID_API_KEY) {
        return await sendEmailViaSendGrid(emailData);
    }

    // Priority 2: Brevo (if configured)
    if (process.env.BREVO_API_KEY) {
        return await sendEmailViaBrevo(emailData);
    }

    // Demo mode (no email service configured)
    console.log('📧 EMAIL (Demo Mode):', {
        to,
        subject,
        from: from || 'noreply@clinicalcanvas.app',
        body: body.substring(0, 100) + '...'
    });

    return {
        success: true,
        message: 'Email logged (demo mode - no email service configured)',
        provider: 'Demo'
    };
}

/**
 * Send SMS via Brevo
 * @param {Object} smsData - { to, body }
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
async function sendSMS(smsData) {
    const { to, body } = smsData;

    // Check if Brevo is configured
    if (!process.env.BREVO_API_KEY) {
        console.log('📱 SMS (Demo Mode):', {
            to,
            body: body.substring(0, 100) + '...'
        });
        return {
            success: true,
            message: 'SMS logged (demo mode - Brevo not configured)'
        };
    }

    try {
        const SibApiV3Sdk = await import('@getbrevo/brevo');
        
        // Configure Brevo SMS
        const apiInstance = new SibApiV3Sdk.default.TransactionalSmsApi();
        apiInstance.setApiKey('api-key', process.env.BREVO_API_KEY);

        const sendTransacSms = new SibApiV3Sdk.default.SendTransacSms();
        sendTransacSms.sender = 'ClinicalCanvas';
        sendTransacSms.recipient = to;
        sendTransacSms.content = body;

        const result = await apiInstance.sendTransacSms(sendTransacSms);
        
        console.log('✅ SMS sent successfully to:', to);
        console.log('   Message ID:', result.messageId);
        
        return {
            success: true,
            message: 'SMS sent successfully',
            messageId: result.messageId
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
            
            Please complete this document at your earliest convenience.
            
            Your access code: ${document.auth_code}
            
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
    sendEmailViaSendGrid,
    sendEmailViaBrevo,
    sendSMS,
    sendDualNotification,
    sendTemplateNotification,
    templates
};



