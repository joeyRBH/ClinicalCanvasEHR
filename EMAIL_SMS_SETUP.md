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

## 📧 Email Templates

The system includes pre-built email templates for:

### Payment Events
- ✅ Payment Received
- ✅ Payment Failed
- ✅ Refund Processed

### Invoice Events
- ✅ Invoice Created
- ✅ Autopay Enabled
- ✅ Autopay Failed

### Appointment Events
- ✅ Appointment Reminder

### Document Events
- ✅ Document Assigned

---

## 📱 SMS Templates

SMS messages are automatically generated from email templates with shortened content.

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

Edit `api/utils/notifications.js`:

```javascript
const templates = {
    paymentReceived: (invoice) => ({
        subject: `Your Custom Subject`,
        body: `Your custom email body...`
    }),
    // Add more templates...
};
```

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

**Last Updated:** October 17, 2024  
**Status:** ✅ Ready for Production



