# AWS SES + Twilio Notification Setup Guide

**Last Updated:** October 25, 2025
**Services:** AWS SES (Email) + Twilio (SMS)
**Monthly Cost:** $1-5 for most practices (vs $27+ with Brevo)

---

## 🎯 Why This Stack?

### **AWS SES for Email**
✅ **Extremely cheap:** $0.10 per 1,000 emails
✅ **Reliable:** 99%+ deliverability
✅ **No SDK issues:** Works perfectly in Vercel serverless
✅ **HIPAA compliant:** BAA available
✅ **Scales automatically:** No daily/monthly limits

### **Twilio for SMS**
✅ **Proven reliable:** Industry standard
✅ **Simple API:** Easy to implement
✅ **HIPAA compliant:** BAA available
✅ **Cost-effective:** $0.0079 per SMS

---

## 📊 Cost Comparison

**Scenario: 100 clients, 500 emails, 100 SMS per month**

| Service | Email Cost | SMS Cost | Total |
|---------|-----------|----------|-------|
| **Brevo** | €25 ($27) | Included? | **~$27+** |
| **AWS SES + Twilio** | $0.05 | $0.79 | **$0.84** |
| **Savings** | | | **$26+/month** |

**Annual Savings:** $300+/year

---

## 🚀 Part 1: AWS SES Setup (Email)

### **Step 1: Create AWS Account**

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Sign up for a new AWS account (or use existing)
3. Complete identity verification

### **Step 2: Set Up SES**

1. **Navigate to SES:**
   - Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
   - Select your region (recommend `us-east-1`)

2. **Verify Email Address:**
   - Click "Verified identities" → "Create identity"
   - Select "Email address"
   - Enter: `noreply@clinicalcanvas.com` (or your email)
   - Click "Create identity"
   - Check your email and click the verification link

3. **Request Production Access:**
   - By default, SES is in "sandbox mode" (can only send to verified emails)
   - Click "Account dashboard" → "Request production access"
   - Fill out the form:
     - **Mail Type:** Transactional
     - **Website URL:** Your Vercel domain
     - **Use Case:** Healthcare EHR system - sending invoices, appointment reminders
     - **Compliance:** HIPAA compliant system
   - Submit (usually approved within 24 hours)

### **Step 3: Create IAM User for API Access**

1. **Go to IAM:**
   - Navigate to [IAM Console](https://console.aws.amazon.com/iam/)
   - Click "Users" → "Add users"

2. **Create User:**
   - User name: `ses-sender`
   - Access type: ✅ Access key - Programmatic access
   - Click "Next: Permissions"

3. **Attach Permissions:**
   - Click "Attach existing policies directly"
   - Search for: `AmazonSESFullAccess`
   - ✅ Check the box
   - Click "Next: Tags" → "Next: Review" → "Create user"

4. **Save Credentials:**
   - **IMPORTANT:** Copy these values (you won't see them again!)
   - **Access Key ID:** `AKIA...` (starts with AKIA)
   - **Secret Access Key:** `wJalr...` (long string)

### **Step 4: Add Environment Variables to Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `ClinicalCanvasEHR`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `AWS_SES_ACCESS_KEY_ID` | `AKIA...` | Your IAM Access Key ID |
| `AWS_SES_SECRET_ACCESS_KEY` | `wJalr...` | Your IAM Secret Access Key |
| `AWS_SES_REGION` | `us-east-1` | Your SES region |

**IMPORTANT:** Select "All Environments" (Production, Preview, Development)

---

## 📱 Part 2: Twilio Setup (SMS)

### **Step 1: Create Twilio Account**

1. Go to [Twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Complete phone verification
4. You get **$15.50 free credit!**

### **Step 2: Get Your Credentials**

1. **Go to Console:**
   - Navigate to [Twilio Console](https://console.twilio.com/)
   - You'll see your **Account SID** and **Auth Token**

2. **Copy Credentials:**
   - **Account SID:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (starts with AC)
   - **Auth Token:** Click "Show" to reveal, then copy

### **Step 3: Get a Phone Number**

1. **Buy a Number:**
   - Go to "Phone Numbers" → "Buy a number"
   - Select "United States"
   - Check "SMS" capability
   - Search and buy a number (~$1/month)

2. **Copy Your Number:**
   - Format: `+1XXXXXXXXXX` (with country code)

### **Step 4: Add Environment Variables to Vercel**

Add these to Vercel (same place as AWS variables):

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Your Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | `+1XXXXXXXXXX` | Your Twilio phone number |

---

## 🧪 Testing

### **Test Email (Demo Mode)**
Without AWS credentials, emails are logged to console:
```bash
curl -X POST https://your-app.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test email from ClinicalCanvas EHR"
  }'
```

Expected response (demo mode):
```json
{
  "success": true,
  "message": "Email logged (demo mode - AWS SES not configured)",
  "demo": true
}
```

### **Test Email (Production Mode)**
After configuring AWS SES:
```bash
curl -X POST https://your-app.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "body": "This is a test email from AWS SES"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "0100018b..."
}
```

### **Test SMS (Demo Mode)**
```bash
curl -X POST https://your-app.vercel.app/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15551234567",
    "message": "Test SMS from ClinicalCanvas"
  }'
```

### **Test SMS (Production Mode)**
After configuring Twilio:
```bash
curl -X POST https://your-app.vercel.app/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15551234567",
    "message": "Test SMS from Twilio"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "messageId": "SM..."
}
```

---

## 🔧 Usage in Your App

### **Send Email**
```javascript
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'client@example.com',
    subject: 'Payment Received - Invoice #123',
    body: 'Thank you for your payment of $100.00'
  })
});

const result = await response.json();
console.log(result); // { success: true, messageId: "..." }
```

### **Send SMS**
```javascript
const response = await fetch('/api/send-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+15551234567',
    message: 'Payment Received! Invoice #123 - $100.00. Thank you!'
  })
});

const result = await response.json();
console.log(result); // { success: true, messageId: "..." }
```

### **Using Templates**
The notification utility includes pre-built templates:

```javascript
// Server-side (in your API endpoint)
const { sendTemplateNotification } = require('./utils/notifications');

// Send payment received notification
const result = await sendTemplateNotification(
  'paymentReceived',
  {
    client_name: 'John Doe',
    invoice_number: 'INV-123',
    total_amount: 100.00
  },
  {
    email: 'john@example.com',
    phone: '+15551234567'
  }
);

console.log(result);
// {
//   email: { success: true, messageId: "..." },
//   sms: { success: true, messageId: "..." }
// }
```

**Available Templates:**
- `paymentReceived` - Payment confirmation
- `paymentFailed` - Payment failure notice
- `refundProcessed` - Refund confirmation
- `invoiceCreated` - New invoice notification
- `autopayEnabled` - Autopay enabled confirmation
- `autopayFailed` - Autopay failure notice
- `appointmentReminder` - Appointment reminder
- `documentAssigned` - Document assignment notice

---

## 🔒 Security & HIPAA Compliance

### **AWS SES Security**
✅ Use IAM user with minimal permissions (only SES access)
✅ Store credentials in Vercel environment variables (never in code)
✅ Use verified sender emails only
✅ Enable encryption in transit (handled automatically by AWS)

### **Twilio Security**
✅ Never expose Auth Token in frontend code
✅ Store credentials in Vercel environment variables
✅ Use HTTPS for all API calls (handled by Vercel)
✅ Monitor usage for suspicious activity

### **HIPAA Compliance**
📄 **AWS SES:** Sign BAA at https://aws.amazon.com/compliance/hipaa-compliance/
📄 **Twilio:** Sign BAA at https://www.twilio.com/legal/hipaa

**Best Practices:**
- ✅ Minimize PHI in notifications
- ✅ Use generic messages when possible
- ✅ Log all notification activity for audit trail
- ✅ Encrypt data at rest in your database
- ✅ Regular security audits

---

## 🐛 Troubleshooting

### **Email Not Sending**

**Error:** "Email address not verified"
- **Solution:** Verify your sender email in AWS SES Console

**Error:** "Request production access"
- **Solution:** You're still in sandbox mode. Request production access in SES Console

**Error:** "Invalid credentials"
- **Solution:** Check your AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY in Vercel

**Error:** "AccessDenied"
- **Solution:** Ensure IAM user has `AmazonSESFullAccess` permission

### **SMS Not Sending**

**Error:** "Failed to send SMS"
- **Solution:** Check Twilio credentials in Vercel environment variables

**Error:** "Invalid phone number format"
- **Solution:** Ensure phone number is in E.164 format: `+1XXXXXXXXXX`

**Error:** "Insufficient balance"
- **Solution:** Add credits to your Twilio account

### **General Issues**

**Problem:** Changes not taking effect
- **Solution:** Redeploy your Vercel app after adding/changing environment variables

**Problem:** Demo mode won't turn off
- **Solution:** Verify all required environment variables are set correctly in Vercel

---

## 📈 Monitoring

### **AWS SES Dashboard**
Monitor email activity:
- Go to [SES Console](https://console.aws.amazon.com/ses/)
- View "Reputation dashboard" for:
  - Bounce rate
  - Complaint rate
  - Delivery rate
- Check "Configuration sets" for detailed analytics

### **Twilio Dashboard**
Monitor SMS activity:
- Go to [Twilio Console](https://console.twilio.com/)
- View "Messaging" → "Logs" for:
  - Sent messages
  - Delivery status
  - Failed messages
- Check "Monitor" → "Alerts" for issues

### **Vercel Logs**
View function execution logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click on latest deployment
5. View "Function Logs"

---

## ✅ Pre-Launch Checklist

### **AWS SES**
- [ ] AWS account created
- [ ] SES region selected (us-east-1 recommended)
- [ ] Sender email verified
- [ ] Production access requested and approved
- [ ] IAM user created with SES permissions
- [ ] Access key and secret key copied
- [ ] Environment variables added to Vercel
- [ ] Test email sent successfully
- [ ] BAA signed with AWS

### **Twilio**
- [ ] Twilio account created
- [ ] Account SID and Auth Token copied
- [ ] Phone number purchased
- [ ] Environment variables added to Vercel
- [ ] Test SMS sent successfully
- [ ] BAA signed with Twilio

### **Deployment**
- [ ] All environment variables set in Vercel
- [ ] App redeployed to Vercel
- [ ] Health check confirms services active
- [ ] Email notifications tested end-to-end
- [ ] SMS notifications tested end-to-end
- [ ] Error handling tested
- [ ] Audit logging verified

---

## 💰 Cost Breakdown

### **AWS SES Pricing**
- **First 62,000 emails/month:** FREE (if sent from EC2)
- **After that:** $0.10 per 1,000 emails
- **No monthly fees**
- **No setup costs**

**Examples:**
- 1,000 emails/month: **$0.10**
- 10,000 emails/month: **$1.00**
- 50,000 emails/month: **$5.00**

### **Twilio Pricing**
- **SMS (US):** $0.0079 per message
- **Phone number:** $1.00/month
- **No monthly fees beyond phone number**

**Examples:**
- 100 SMS/month: **$0.79 + $1.00 = $1.79**
- 500 SMS/month: **$3.95 + $1.00 = $4.95**
- 1,000 SMS/month: **$7.90 + $1.00 = $8.90**

### **Total Monthly Cost**

| Usage | AWS SES | Twilio | Total |
|-------|---------|--------|-------|
| **Small** (500 emails, 50 SMS) | $0.05 | $1.40 | **$1.45** |
| **Medium** (2,000 emails, 200 SMS) | $0.20 | $2.58 | **$2.78** |
| **Large** (10,000 emails, 500 SMS) | $1.00 | $4.95 | **$5.95** |

**Compare to Brevo:** €25/month = $27/month
**Savings:** $21-25/month = **$250-300/year**

---

## 📞 Support

### **AWS SES**
- **Documentation:** https://docs.aws.amazon.com/ses/
- **Support:** https://aws.amazon.com/support/
- **Status:** https://status.aws.amazon.com/

### **Twilio**
- **Documentation:** https://www.twilio.com/docs/sms
- **Support:** https://support.twilio.com/
- **Status:** https://status.twilio.com/

---

## 🎉 You're All Set!

Your ClinicalCanvas EHR now has **reliable, cost-effective notifications** using:

✅ **AWS SES** for email (99%+ deliverability, $0.10 per 1,000 emails)
✅ **Twilio** for SMS (industry standard, $0.0079 per SMS)
✅ **HIPAA compliant** with BAAs signed
✅ **Automatic failover** to demo mode if services unavailable
✅ **Full audit logging** for compliance

**Total Setup Time:** 30-60 minutes
**Monthly Cost:** $1-5 for most practices
**Annual Savings vs Brevo:** $250-300+

---

**Questions or Issues?**
Check the troubleshooting section above or review the Vercel function logs for detailed error messages.
