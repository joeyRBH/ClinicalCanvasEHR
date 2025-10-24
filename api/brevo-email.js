const { TransactionalEmailsApi, SendSmtpEmail } = require('@getbrevo/brevo');

// Initialize Brevo API client with API key
const apiInstance = new TransactionalEmailsApi();
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

/**
 * Send email using Brevo
 * @param {Object} emailData - Email configuration
 * @param {string} emailData.to - Recipient email address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.htmlContent - HTML content of the email
 * @param {string} emailData.textContent - Plain text content of the email
 * @param {string} emailData.fromEmail - Sender email address (defaults to env var)
 * @param {string} emailData.fromName - Sender name (defaults to env var)
 * @returns {Promise<Object>} - Brevo API response
 */
async function sendEmail(emailData) {
    try {
        const {
            to,
            subject,
            htmlContent,
            textContent,
            fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@clinicalcanvas.com',
            fromName = process.env.BREVO_FROM_NAME || 'ClinicalCanvas EHR'
        } = emailData;

        // Create email data object
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.textContent = textContent;
        sendSmtpEmail.sender = { 
            name: fromName, 
            email: fromEmail 
        };

        // Send email
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        
        console.log('Brevo email sent successfully:', result.body);
        return {
            success: true,
            messageId: result.body.messageId,
            data: result.body
        };

    } catch (error) {
        console.error('Brevo email error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email'
        };
    }
}

/**
 * Send welcome email to new user
 * @param {Object} userData - User information
 * @returns {Promise<Object>} - Email sending result
 */
async function sendWelcomeEmail(userData) {
    const { email, firstName, lastName, practiceName } = userData;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to ClinicalCanvas EHR</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #FFE066; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: #87CEEB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏥 Welcome to ClinicalCanvas EHR!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${firstName} ${lastName},</h2>
                    <p>Welcome to ClinicalCanvas EHR! Your practice "${practiceName}" is now set up and ready to go.</p>
                    
                    <h3>🎉 You're starting with a 14-day free trial!</h3>
                    <p>Your trial includes:</p>
                    <ul>
                        <li>✅ Unlimited client management</li>
                        <li>✅ Appointment scheduling</li>
                        <li>✅ Document management</li>
                        <li>✅ Invoice generation</li>
                        <li>✅ Reports and analytics</li>
                        <li>✅ HIPAA-compliant features</li>
                    </ul>
                    
                    <p><a href="https://clinicalcanvas.app" class="button">Start Using ClinicalCanvas</a></p>
                    
                    <h3>📚 Getting Started Tips:</h3>
                    <ol>
                        <li><strong>Add Your First Client:</strong> Click "New Client" to start building your client database</li>
                        <li><strong>Schedule Appointments:</strong> Use the calendar to book appointments with your clients</li>
                        <li><strong>Assign Documents:</strong> Send intake forms and assessments to clients via secure auth codes</li>
                        <li><strong>Generate Invoices:</strong> Create professional invoices with CPT codes</li>
                        <li><strong>Track Progress:</strong> Use the reports section to analyze your practice</li>
                    </ol>
                    
                    <h3>💡 Pro Tips:</h3>
                    <ul>
                        <li>Use the client charts to get a complete view of each client's history</li>
                        <li>Set up automated email reminders for appointments</li>
                        <li>Generate monthly superbills for insurance claims</li>
                        <li>Use the audit logs to maintain HIPAA compliance</li>
                    </ul>
                    
                    <p>Need help? Our support team is here for you!</p>
                </div>
                <div class="footer">
                    <p>ClinicalCanvas EHR - Simplifying Clinical Practice Management</p>
                    <p>This email was sent to ${email}. If you didn't request this, please ignore.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
        Welcome to ClinicalCanvas EHR!
        
        Hello ${firstName} ${lastName},
        
        Welcome to ClinicalCanvas EHR! Your practice "${practiceName}" is now set up and ready to go.
        
        You're starting with a 14-day free trial that includes:
        - Unlimited client management
        - Appointment scheduling
        - Document management
        - Invoice generation
        - Reports and analytics
        - HIPAA-compliant features
        
        Start using ClinicalCanvas: https://clinicalcanvas.app
        
        Getting Started Tips:
        1. Add Your First Client: Click "New Client" to start building your client database
        2. Schedule Appointments: Use the calendar to book appointments with your clients
        3. Assign Documents: Send intake forms and assessments to clients via secure auth codes
        4. Generate Invoices: Create professional invoices with CPT codes
        5. Track Progress: Use the reports section to analyze your practice
        
        Need help? Our support team is here for you!
        
        ClinicalCanvas EHR - Simplifying Clinical Practice Management
    `;

    return await sendEmail({
        to: email,
        subject: '🎉 Welcome to ClinicalCanvas EHR - Your 14-Day Free Trial Starts Now!',
        htmlContent,
        textContent
    });
}

/**
 * Send appointment reminder email
 * @param {Object} appointmentData - Appointment information
 * @returns {Promise<Object>} - Email sending result
 */
async function sendAppointmentReminder(appointmentData) {
    const { clientEmail, clientName, appointmentDate, appointmentTime, clinicianName, practiceName } = appointmentData;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Appointment Reminder</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #FFE066; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📅 Appointment Reminder</h1>
                </div>
                <div class="content">
                    <h2>Hello ${clientName},</h2>
                    <p>This is a friendly reminder about your upcoming appointment.</p>
                    
                    <div class="appointment-details">
                        <h3>Appointment Details:</h3>
                        <p><strong>Date:</strong> ${appointmentDate}</p>
                        <p><strong>Time:</strong> ${appointmentTime}</p>
                        <p><strong>Clinician:</strong> ${clinicianName}</p>
                        <p><strong>Practice:</strong> ${practiceName}</p>
                    </div>
                    
                    <p>Please arrive 10 minutes early for your appointment.</p>
                    <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
                    
                    <p>Thank you for choosing ${practiceName}!</p>
                </div>
                <div class="footer">
                    <p>${practiceName} - Your health and wellness partner</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
        Appointment Reminder
        
        Hello ${clientName},
        
        This is a friendly reminder about your upcoming appointment.
        
        Appointment Details:
        Date: ${appointmentDate}
        Time: ${appointmentTime}
        Clinician: ${clinicianName}
        Practice: ${practiceName}
        
        Please arrive 10 minutes early for your appointment.
        If you need to reschedule or cancel, please contact us as soon as possible.
        
        Thank you for choosing ${practiceName}!
    `;

    return await sendEmail({
        to: clientEmail,
        subject: `📅 Appointment Reminder - ${appointmentDate} at ${appointmentTime}`,
        htmlContent,
        textContent
    });
}

/**
 * Send invoice email
 * @param {Object} invoiceData - Invoice information
 * @returns {Promise<Object>} - Email sending result
 */
async function sendInvoiceEmail(invoiceData) {
    const { clientEmail, clientName, invoiceNumber, totalAmount, dueDate, practiceName } = invoiceData;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #FFE066; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .invoice-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💰 Invoice</h1>
                </div>
                <div class="content">
                    <h2>Hello ${clientName},</h2>
                    <p>Please find your invoice attached.</p>
                    
                    <div class="invoice-details">
                        <h3>Invoice Details:</h3>
                        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                        <p><strong>Total Amount:</strong> $${totalAmount}</p>
                        <p><strong>Due Date:</strong> ${dueDate}</p>
                        <p><strong>Practice:</strong> ${practiceName}</p>
                    </div>
                    
                    <p>Please remit payment by the due date. If you have any questions about this invoice, please contact us.</p>
                    
                    <p>Thank you for your business!</p>
                </div>
                <div class="footer">
                    <p>${practiceName} - Professional Healthcare Services</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
        Invoice
        
        Hello ${clientName},
        
        Please find your invoice details below.
        
        Invoice Details:
        Invoice Number: ${invoiceNumber}
        Total Amount: $${totalAmount}
        Due Date: ${dueDate}
        Practice: ${practiceName}
        
        Please remit payment by the due date. If you have any questions about this invoice, please contact us.
        
        Thank you for your business!
    `;

    return await sendEmail({
        to: clientEmail,
        subject: `💰 Invoice ${invoiceNumber} from ${practiceName}`,
        htmlContent,
        textContent
    });
}

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendAppointmentReminder,
    sendInvoiceEmail
};
