const { sendEmail } = require('./brevo-email');
const { sendSMS } = require('./brevo-sms');

/**
 * Test endpoint for Brevo email and SMS functionality
 */
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Return test page HTML
            return res.status(200).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Brevo Integration Test</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                        .test-section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
                        .form-group { margin: 15px 0; }
                        label { display: block; margin-bottom: 5px; font-weight: bold; }
                        input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
                        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                        button:hover { background: #0056b3; }
                        .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
                        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
                        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
                    </style>
                </head>
                <body>
                    <h1>🧪 Brevo Integration Test</h1>
                    <p>Test email and SMS functionality with Brevo</p>
                    
                    <div class="test-section">
                        <h2>📧 Test Email</h2>
                        <form id="emailTestForm">
                            <div class="form-group">
                                <label for="emailTo">To Email:</label>
                                <input type="email" id="emailTo" required placeholder="test@example.com">
                            </div>
                            <div class="form-group">
                                <label for="emailSubject">Subject:</label>
                                <input type="text" id="emailSubject" value="Test Email from ClinicalCanvas">
                            </div>
                            <div class="form-group">
                                <label for="emailContent">Content:</label>
                                <textarea id="emailContent" rows="5">This is a test email from ClinicalCanvas EHR to verify Brevo integration is working correctly.</textarea>
                            </div>
                            <button type="submit">Send Test Email</button>
                        </form>
                        <div id="emailResult" class="result" style="display: none;"></div>
                    </div>
                    
                    <div class="test-section">
                        <h2>📱 Test SMS</h2>
                        <form id="smsTestForm">
                            <div class="form-group">
                                <label for="smsTo">To Phone (with country code):</label>
                                <input type="tel" id="smsTo" required placeholder="+1234567890">
                            </div>
                            <div class="form-group">
                                <label for="smsContent">Message:</label>
                                <textarea id="smsContent" rows="3">Test SMS from ClinicalCanvas EHR - Brevo integration working!</textarea>
                            </div>
                            <button type="submit">Send Test SMS</button>
                        </form>
                        <div id="smsResult" class="result" style="display: none;"></div>
                    </div>
                    
                    <script>
                        document.getElementById('emailTestForm').addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const resultDiv = document.getElementById('emailResult');
                            
                            try {
                                const response = await fetch('/api/send-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        emailType: 'general',
                                        emailData: {
                                            to: document.getElementById('emailTo').value,
                                            subject: document.getElementById('emailSubject').value,
                                            htmlContent: '<p>' + document.getElementById('emailContent').value.replace(/\\n/g, '<br>') + '</p>',
                                            textContent: document.getElementById('emailContent').value
                                        }
                                    })
                                });
                                
                                const result = await response.json();
                                
                                resultDiv.style.display = 'block';
                                resultDiv.className = 'result ' + (result.success ? 'success' : 'error');
                                resultDiv.innerHTML = result.success ? 
                                    '✅ Email sent successfully! Message ID: ' + result.messageId :
                                    '❌ Failed to send email: ' + result.error;
                            } catch (error) {
                                resultDiv.style.display = 'block';
                                resultDiv.className = 'result error';
                                resultDiv.innerHTML = '❌ Error: ' + error.message;
                            }
                        });
                        
                        document.getElementById('smsTestForm').addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const resultDiv = document.getElementById('smsResult');
                            
                            try {
                                const response = await fetch('/api/send-sms', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        smsType: 'general',
                                        smsData: {
                                            to: document.getElementById('smsTo').value,
                                            message: document.getElementById('smsContent').value
                                        }
                                    })
                                });
                                
                                const result = await response.json();
                                
                                resultDiv.style.display = 'block';
                                resultDiv.className = 'result ' + (result.success ? 'success' : 'error');
                                resultDiv.innerHTML = result.success ? 
                                    '✅ SMS sent successfully! Message ID: ' + result.messageId :
                                    '❌ Failed to send SMS: ' + result.error;
                            } catch (error) {
                                resultDiv.style.display = 'block';
                                resultDiv.className = 'result error';
                                resultDiv.innerHTML = '❌ Error: ' + error.message;
                            }
                        });
                    </script>
                </body>
                </html>
            `);
        }

        if (req.method === 'POST') {
            // Quick test endpoint
            const { testType } = req.body;
            
            if (testType === 'email') {
                const result = await sendEmail({
                    to: req.body.email || 'test@example.com',
                    subject: 'Brevo Test Email',
                    htmlContent: '<p>This is a test email from ClinicalCanvas EHR via Brevo.</p>',
                    textContent: 'This is a test email from ClinicalCanvas EHR via Brevo.'
                });
                
                return res.status(200).json(result);
            }
            
            if (testType === 'sms') {
                const result = await sendSMS({
                    to: req.body.phone || '+1234567890',
                    message: 'Test SMS from ClinicalCanvas EHR via Brevo'
                });
                
                return res.status(200).json(result);
            }
        }

        return res.status(400).json({ error: 'Invalid request' });

    } catch (error) {
        console.error('Test endpoint error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
