const { TransactionalSmsApi, SendTransacSms } = require('@getbrevo/brevo');

// Initialize Brevo API client for SMS with API key
const apiInstance = new TransactionalSmsApi();
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

/**
 * Send SMS using Brevo
 * @param {Object} smsData - SMS configuration
 * @param {string} smsData.to - Recipient phone number (with country code, e.g., +1234567890)
 * @param {string} smsData.message - SMS message content
 * @param {string} smsData.from - Sender phone number (defaults to env var)
 * @returns {Promise<Object>} - Brevo API response
 */
async function sendSMS(smsData) {
    try {
        const {
            to,
            message,
            from = process.env.BREVO_SMS_FROM_NUMBER
        } = smsData;

        // Validate phone number format
        if (!to.startsWith('+')) {
            throw new Error('Phone number must include country code (e.g., +1234567890)');
        }

        // Create SMS data object
        const sendTransacSms = new SendTransacSms();
        sendTransacSms.to = to;
        sendTransacSms.message = message;
        sendTransacSms.sender = from;

        // Send SMS
        const result = await apiInstance.sendTransacSms(sendTransacSms);
        
        console.log('Brevo SMS sent successfully:', result.body);
        return {
            success: true,
            messageId: result.body.messageId,
            data: result.body
        };

    } catch (error) {
        console.error('Brevo SMS error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send SMS'
        };
    }
}

/**
 * Send appointment reminder SMS (HIPAA-compliant - no PHI)
 * @param {Object} appointmentData - Appointment information
 * @returns {Promise<Object>} - SMS sending result
 */
async function sendAppointmentReminderSMS(appointmentData) {
    const { clientPhone, appointmentDate, appointmentTime } = appointmentData;
    
    const message = `Reminder: You have an appointment scheduled for ${appointmentDate} at ${appointmentTime}. Please arrive 10 minutes early. Reply STOP to opt out.`;
    
    return await sendSMS({
        to: clientPhone,
        message: message
    });
}

/**
 * Send payment reminder SMS (HIPAA-compliant - no PHI)
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} - SMS sending result
 */
async function sendPaymentReminderSMS(paymentData) {
    const { clientPhone, invoiceNumber, totalAmount } = paymentData;
    
    const message = `Friendly reminder: Invoice ${invoiceNumber} for $${totalAmount} is due. Please contact your healthcare provider with questions. Reply STOP to opt out.`;
    
    return await sendSMS({
        to: clientPhone,
        message: message
    });
}

/**
 * Send urgent notification SMS (HIPAA-compliant - no PHI)
 * @param {Object} notificationData - Notification information
 * @returns {Promise<Object>} - SMS sending result
 */
async function sendUrgentNotificationSMS(notificationData) {
    const { clientPhone, message } = notificationData;
    
    const smsMessage = `URGENT: ${message} Please contact your healthcare provider immediately. Reply STOP to opt out.`;
    
    return await sendSMS({
        to: clientPhone,
        message: smsMessage
    });
}

/**
 * Send document completion reminder SMS (HIPAA-compliant - no PHI)
 * @param {Object} documentData - Document information
 * @returns {Promise<Object>} - SMS sending result
 */
async function sendDocumentReminderSMS(documentData) {
    const { clientPhone, documentName, authCode } = documentData;
    
    const message = `Please complete your ${documentName} using code: ${authCode}. Visit: https://clinicalcanvas.app/client. Reply STOP to opt out.`;
    
    return await sendSMS({
        to: clientPhone,
        message: message
    });
}

module.exports = {
    sendSMS,
    sendAppointmentReminderSMS,
    sendPaymentReminderSMS,
    sendUrgentNotificationSMS,
    sendDocumentReminderSMS
};
