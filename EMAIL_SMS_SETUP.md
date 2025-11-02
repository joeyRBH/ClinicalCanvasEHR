# Email & SMS Integration Setup Guide

## 🚀 Quick Setup

### 1. **SendGrid Setup (Email)**

1. **Create SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com)
   - Sign up for free account (100 emails/day free)

2. **Get API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "ClinicalCanvas"
   - Permissions: Full Access
   - Click "Create & View"
   - **COPY THE KEY** (you won't see it again!)

3. **Add to Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `SENDGRID_API_KEY` = `SG.xxxxxxxxxxxxx`
   - Click "Save"

4. **Verify Sender**
   - Go to Settings → Sender Authentication
   - Verify your email address
   - Or set up domain authentication (recommended for production)

---

### 2. **Twilio Setup (SMS)**

1. **Create Twilio Account**
   - Go to [Twilio](https://www.twilio.com)
   - Sign up for free account ($15.50 credit)

2. **Get Credentials**
   - Go to Console Dashboard
   - Copy:
     - Account SID
     - Auth Token
   - Get a phone number: Phone Numbers → Buy a Number

3. **Add to Vercel**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `TWILIO_ACCOUNT_SID` = `ACxxxxxxxxxxxxx`
     - `TWILIO_AUTH_TOKEN` = `xxxxxxxxxxxxx`
     - `TWILIO_PHONE_NUMBER` = `+1234567890`

---

## 🏥 Practice Branding

**NEW:** All notifications now reflect your practice's information instead of ClinicalCanvas branding!

### What's Branded
- ✅ **Email Header:** Your practice name prominently displayed
- ✅ **From Name:** Emails sent from your practice name
- ✅ **Contact Info:** Your practice phone, email, and website in email footer
- ✅ **SMS Messages:** Signed with your practice name
- ✅ **Professional HTML Emails:** Beautiful, responsive design

### ClinicalCanvas Attribution
- 📧 **Email Footer Only:** "Powered by ClinicalCanvas - HIPAA Compliant Messenger"
- 📱 **SMS:** No ClinicalCanvas branding (only your practice name)

### How It Works
The notification system automatically fetches your practice settings from the database and uses them to brand all communications. Simply configure your practice information in the Practice Settings page, and all notifications will use your branding.

---

## 📧 Email Templates

The system includes pre-built email templates with professional HTML design:

### Payment Events
- ✅ Payment Received (with payment confirmation block)
- ✅ Payment Failed (with error details)
- ✅ Refund Processed (with refund timeline)

### Invoice Events
- ✅ Invoice Created (with invoice details block)
- ✅ Autopay Enabled (with confirmation)
- ✅ Autopay Failed (with instructions)

### Appointment Events
- ✅ Appointment Reminder (with appointment details block)

### Document Events
- ✅ Document Assigned (with secure access instructions)

**All templates include:**
- Professional HTML design with your practice branding
- Contact information footer
- HIPAA compliance notice
- Mobile-responsive layout

---

## 📱 SMS Templates

SMS messages are automatically generated from email templates with:
- Shortened, concise content
- Your practice name in signature
- No ClinicalCanvas branding
- Plain text format optimized for mobile

---

## 🧪 Testing

### Test Email (Demo Mode)
Without SendGrid configured, emails are logged to console:
```
📧 EMAIL (Demo Mode): {
  to: 'client@example.com',
  subject: 'Payment Received - Invoice INV-20241017-001',
  body: 'Dear Client...'
}
```

### Test SMS (Demo Mode)
Without Twilio configured, SMS are logged to console:
```
📱 SMS (Demo Mode): {
  to: '+1234567890',
  body: 'Payment Received...'
}
```

### Test with Real Services
1. Set environment variables in Vercel
2. Redeploy
3. Trigger a payment event
4. Check email/SMS delivery

---

## 💰 Costs

### SendGrid
- **Free Tier:** 100 emails/day
- **Paid:** $19.95/month for 50,000 emails

### Twilio
- **SMS:** ~$0.0075 per message (US)
- **Free Credit:** $15.50 to start
- **Phone Number:** ~$1/month

**Estimated Monthly Cost:**
- Small practice (100 clients): ~$20-30/month
- Medium practice (500 clients): ~$50-75/month
- Large practice (1000+ clients): ~$100-150/month

---

## 🔧 Configuration

### Email Settings

```javascript
// Default sender email
const from = 'noreply@clinicalcanvas.com';

// Customize in notifications.js
```

### SMS Settings

```javascript
// Twilio phone number
const from = process.env.TWILIO_PHONE_NUMBER;

// Customize in notifications.js
```

---

## 📊 Notification Flow

```
Payment Event Occurs
    ↓
Frontend calls notification function
    ↓
API endpoint receives request
    ↓
Checks if email/SMS configured
    ↓
YES → Sends via SendGrid/Twilio
NO → Logs to console (demo mode)
    ↓
Returns success/failure
```

---

## 🎨 Customizing Templates

### Using Templates with Practice Branding

```javascript
const { sendTemplateNotification, getPracticeSettings } = require('./utils/notifications');

// Fetch practice settings for the user
const practiceSettings = await getPracticeSettings(userId);

// Send notification with practice branding
await sendTemplateNotification(
    'paymentReceived',
    { invoice: invoiceData },
    { email: 'client@example.com', phone: '+1234567890' },
    practiceSettings
);
```

### Creating Custom Templates

Edit `api/utils/notifications.js`:

```javascript
const templates = {
    customTemplate: (data, practiceSettings = {}) => {
        const practiceName = practiceSettings.practice_name || 'Your Practice';

        return {
            subject: `Your Custom Subject`,
            body: `Dear ${data.client_name},

Your custom message here...

Best regards,
${practiceName}`,
            html: createHTMLEmail(`
                <p>Dear ${data.client_name},</p>
                <p>Your custom HTML message here...</p>
                <p>Best regards,<br>${practiceName}</p>
            `, practiceSettings)
        };
    }
};
```

### Practice Settings Fields Available

- `practice_name` - Your practice/clinic name
- `practice_address` - Physical address
- `practice_phone` - Contact phone number
- `practice_email` - Contact email
- `practice_website` - Website URL
- `provider_npi` - NPI number
- `provider_tax_id` - Tax ID
- `provider_license` - License number

---

## 🔒 Security & Privacy

### Email
- ✅ HIPAA-compliant with BAA
- ✅ Encrypted in transit (TLS)
- ✅ No PHI in subject lines
- ✅ Secure storage of credentials

### SMS
- ✅ HIPAA-compliant with BAA
- ✅ Encrypted in transit
- ✅ No PHI in messages
- ✅ Secure storage of credentials

### Best Practices
- ✅ Always use environment variables
- ✅ Never commit API keys to git
- ✅ Rotate API keys regularly
- ✅ Monitor usage and costs
- ✅ Set up alerts for failures

---

## 🐛 Troubleshooting

### Email Not Sending

**Problem:** Emails not received

**Solutions:**
1. Check `SENDGRID_API_KEY` is set in Vercel
2. Verify sender email is authenticated
3. Check SendGrid dashboard for errors
4. Verify recipient email is valid
5. Check spam folder

### SMS Not Sending

**Problem:** SMS not received

**Solutions:**
1. Check Twilio credentials are set
2. Verify phone number format (+1234567890)
3. Check Twilio dashboard for errors
4. Verify account has credits
5. Check phone number is valid

### High Costs

**Problem:** Unexpected charges

**Solutions:**
1. Monitor usage in SendGrid/Twilio dashboards
2. Set up usage alerts
3. Implement rate limiting
4. Use email for non-urgent notifications
5. Batch notifications where possible

---

## 📈 Monitoring

### SendGrid Dashboard
- Email delivery rate
- Bounce rate
- Spam reports
- Open/click rates

### Twilio Dashboard
- SMS delivery status
- Failed messages
- Usage statistics
- Account balance

---

## 🚀 Going Live

### Production Checklist

- [ ] SendGrid API key added to Vercel
- [ ] Sender email verified
- [ ] Domain authentication set up (optional)
- [ ] Twilio credentials added to Vercel
- [ ] Twilio phone number purchased
- [ ] BAA signed with SendGrid
- [ ] BAA signed with Twilio
- [ ] Test emails sent successfully
- [ ] Test SMS sent successfully
- [ ] Monitoring alerts configured
- [ ] Usage limits set
- [ ] Cost alerts configured

---

## 📞 Support

### SendGrid
- **Docs:** https://docs.sendgrid.com
- **Support:** https://support.sendgrid.com
- **Status:** https://status.sendgrid.com

### Twilio
- **Docs:** https://www.twilio.com/docs
- **Support:** https://support.twilio.com
- **Status:** https://status.twilio.com

---

**Last Updated:** November 2, 2025
**Status:** ✅ Ready for Production
**New Feature:** 🏥 Practice Branding - All notifications now use your practice information!



