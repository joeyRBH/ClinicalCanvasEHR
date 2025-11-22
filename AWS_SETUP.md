# AWS SES & SNS Setup Guide

**Last Updated:** November 5, 2025
**Services:** AWS SES (Email) + AWS SNS (SMS)
**Monthly Cost:** $1-5 for most practices

---

## 🎯 Why AWS SES & SNS?

### **AWS SES for Email**
✅ **Extremely cheap:** $0.10 per 1,000 emails
✅ **Reliable:** 99%+ deliverability
✅ **Works perfectly in serverless:** No SDK compatibility issues
✅ **HIPAA compliant:** BAA available
✅ **Scales automatically:** No daily/monthly limits
✅ **First 62,000 emails/month FREE** (if sent from EC2, otherwise $0.10 per 1,000)

### **AWS SNS for SMS**
✅ **Global reach:** Send SMS worldwide
✅ **Simple API:** Easy to implement
✅ **HIPAA compliant:** BAA available with AWS
✅ **Cost-effective:** $0.00645 per SMS (US)
✅ **No phone number required:** Unlike Twilio
✅ **Transactional messages:** Optimized for critical notifications

---

## 📊 Cost Breakdown

**Scenario: 100 clients, 500 emails, 100 SMS per month**

| Service | Email Cost | SMS Cost | Total |
|---------|-----------|----------|-------|
| **AWS SES + SNS** | $0.05 | $0.65 | **$0.70/month** |

**Annual Cost:** ~$8-50/year (depending on volume)

---

## 🚀 Part 1: AWS Account Setup

### **Step 1: Create AWS Account**

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Sign up for a new AWS account (or use existing)
3. Complete identity verification
4. Add payment method

---

## 📧 Part 2: AWS SES Setup (Email)

### **Step 1: Navigate to SES**

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Select your region (recommend `us-east-1` for lowest latency)

### **Step 2: Verify Email Address**

1. Click **"Verified identities"** → **"Create identity"**
2. Select **"Email address"**
3. Enter your sender email: `noreply@yourdomain.com`
4. Click **"Create identity"**
5. Check your email inbox and click the verification link
6. Status should show as **"Verified"**

### **Step 3: Request Production Access**

By default, SES is in "sandbox mode" (can only send to verified emails).

1. Click **"Account dashboard"** → **"Request production access"**
2. Fill out the form:
   - **Mail Type:** Transactional
   - **Website URL:** Your Vercel domain (e.g., `https://sessionably.vercel.app`)
   - **Use Case Description:**
     ```
     Healthcare EHR (Electronic Health Records) system sending transactional
     notifications including:
     - Invoice and payment confirmations
     - Appointment reminders
     - Document assignment notifications
     - HIPAA-compliant patient communications

     All emails are transactional and sent only to verified users who have
     opted in to receive notifications.
     ```
   - **Compliance:** Mention HIPAA compliance
   - **Expected volume:** Estimate your monthly email volume (e.g., 1,000-5,000)
3. Submit request
4. **Usually approved within 24 hours**

### **Step 4: Create IAM User for SES**

1. Navigate to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Users"** → **"Add users"**
3. User name: `sessionably-ses-sender`
4. Access type: ✅ **Programmatic access** (Access key)
5. Click **"Next: Permissions"**

### **Step 5: Attach SES Permissions**

1. Click **"Attach existing policies directly"**
2. Search for: `AmazonSESFullAccess`
3. ✅ Check the box
4. Click **"Next: Tags"** → **"Next: Review"** → **"Create user"**

### **Step 6: Save SES Credentials**

**IMPORTANT:** Copy these values immediately (you won't see them again!)

- **Access Key ID:** `AKIA...` (starts with AKIA)
- **Secret Access Key:** `wJalr...` (long string)

Save these for later - you'll add them to Vercel environment variables.

---

## 📱 Part 3: AWS SNS Setup (SMS)

### **Step 1: Navigate to SNS**

1. Go to [AWS SNS Console](https://console.aws.amazon.com/sns/)
2. Ensure you're in the same region as SES (e.g., `us-east-1`)

### **Step 2: Configure SMS Settings**

1. Click **"Text messaging (SMS)"** in the left sidebar
2. Click **"SMS preferences"** tab
3. Configure settings:
   - **Default message type:** Transactional
   - **Account spend limit:** Set based on your needs (e.g., $10/month)
   - **Default sender ID:** Optional (not supported in US)
4. Click **"Save changes"**

### **Step 3: Create IAM User for SNS**

You can use the same IAM user for both SES and SNS, or create separate users.

**Option A: Use Same IAM User (Recommended for simplicity)**

1. Go back to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Users"** → Select your existing `sessionably-ses-sender` user
3. Click **"Add permissions"** → **"Attach existing policies directly"**
4. Search for: `AmazonSNSFullAccess`
5. ✅ Check the box
6. Click **"Next: Review"** → **"Add permissions"**

**Option B: Create Separate IAM User**

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Users"** → **"Add users"**
3. User name: `sessionably-sns-sender`
4. Access type: ✅ **Programmatic access**
5. Click **"Next: Permissions"**
6. Search for: `AmazonSNSFullAccess`
7. ✅ Check the box
8. Click **"Next: Tags"** → **"Next: Review"** → **"Create user"**
9. **Save the Access Key ID and Secret Access Key**

---

## 🔧 Part 4: Vercel Environment Variables

### **Step 1: Add Environment Variables**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `SessionablyEHR`
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

#### **AWS SES Variables**

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `AWS_SES_ACCESS_KEY_ID` | `AKIA...` | IAM Access Key ID |
| `AWS_SES_SECRET_ACCESS_KEY` | `wJalr...` | IAM Secret Access Key |
| `AWS_SES_REGION` | `us-east-1` | AWS region |
| `AWS_SES_FROM_EMAIL` | `noreply@yourdomain.com` | Verified sender email |
| `AWS_SES_FROM_NAME` | `Sessionably` | Sender name |

#### **AWS SNS Variables**

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `AWS_SNS_ACCESS_KEY_ID` | `AKIA...` | IAM Access Key ID (can be same as SES) |
| `AWS_SNS_SECRET_ACCESS_KEY` | `wJalr...` | IAM Secret Access Key (can be same as SES) |
| `AWS_SNS_REGION` | `us-east-1` | AWS region (same as SES) |

**IMPORTANT:**
- Select **"All Environments"** (Production, Preview, Development)
- If using the same IAM user for both SES and SNS, use the same access key values

### **Step 2: Redeploy Application**

After adding environment variables, redeploy your application:

1. Go to **Deployments** tab in Vercel
2. Click **"Redeploy"** on the latest deployment
3. Wait for deployment to complete

---

## 🧪 Testing

### **Test Email**

```bash
curl -X POST https://your-app.vercel.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email from AWS SES",
    "body": "This is a test email sent via Amazon SES"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email sent successfully via AWS SES",
  "messageId": "0100018b...",
  "provider": "AWS SES"
}
```

### **Test SMS**

```bash
curl -X POST https://your-app.vercel.app/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15551234567",
    "message": "Test SMS from AWS SNS - Sessionably"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SMS sent successfully via AWS SNS",
  "messageId": "SM...",
  "provider": "AWS SNS"
}
```

---

## 🔧 Usage in Your Application

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
console.log(result);
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
console.log(result);
```

### **Using Notification Templates**

```javascript
// Server-side (in your API endpoint)
const { sendTemplateNotification, getPracticeSettings } = require('./utils/notifications');

// Fetch practice settings for branding
const practiceSettings = await getPracticeSettings(userId);

// Send payment received notification
const result = await sendTemplateNotification(
  'paymentReceived',
  {
    invoice: {
      client_name: 'John Doe',
      invoice_number: 'INV-123',
      total_amount: 100.00
    }
  },
  {
    email: 'john@example.com',
    phone: '+15551234567'
  },
  practiceSettings
);

console.log(result);
// {
//   email: { success: true, messageId: "...", provider: "AWS SES" },
//   sms: { success: true, messageId: "...", provider: "AWS SNS" }
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

### **AWS Security Best Practices**

✅ Use IAM users with minimal permissions (only SES and SNS access)
✅ Store credentials in Vercel environment variables (never in code)
✅ Rotate access keys regularly (every 90 days recommended)
✅ Enable MFA on AWS root account
✅ Use separate IAM users for production vs development
✅ Monitor CloudWatch logs for suspicious activity

### **HIPAA Compliance**

📄 **AWS BAA:** Sign Business Associate Agreement at [AWS HIPAA Compliance](https://aws.amazon.com/compliance/hipaa-compliance/)

**To sign AWS BAA:**
1. Log in to AWS Console
2. Go to AWS Artifact
3. Download and sign the BAA
4. Upload signed BAA

**Best Practices:**
- ✅ Minimize PHI in notifications
- ✅ Use generic messages when possible (e.g., "You have a new message" instead of including medical details)
- ✅ Log all notification activity for audit trail
- ✅ Encrypt data at rest in your database
- ✅ Use secure authentication for patient portal
- ✅ Regular security audits

---

## 🐛 Troubleshooting

### **Email Issues**

**Error: "Email address not verified"**
- **Solution:** Verify your sender email in AWS SES Console

**Error: "MessageRejected: Email address is not verified"**
- **Solution:** You're still in sandbox mode. Request production access in SES Console

**Error: "InvalidClientTokenId"**
- **Solution:** Check your `AWS_SES_ACCESS_KEY_ID` in Vercel environment variables

**Error: "SignatureDoesNotMatch"**
- **Solution:** Check your `AWS_SES_SECRET_ACCESS_KEY` in Vercel environment variables

**Error: "AccessDenied"**
- **Solution:** Ensure IAM user has `AmazonSESFullAccess` permission

### **SMS Issues**

**Error: "InvalidParameter: Invalid parameter: PhoneNumber"**
- **Solution:** Ensure phone number is in E.164 format: `+1XXXXXXXXXX` (must include country code)

**Error: "AuthorizationError"**
- **Solution:** Check AWS SNS credentials in Vercel environment variables

**Error: "OptedOut: The phone number has opted out"**
- **Solution:** User has opted out of SMS. Remove from SMS list.

**SMS not delivered**
- **Solution:** Check AWS SNS console for delivery logs. Some carriers block transactional SMS.

### **General Issues**

**Problem: Changes not taking effect**
- **Solution:** Redeploy your Vercel app after adding/changing environment variables

**Problem: Demo mode won't turn off**
- **Solution:** Verify ALL required environment variables are set correctly in Vercel

**Problem: High costs**
- **Solution:** Set spending limits in AWS console. Monitor usage in CloudWatch.

---

## 📈 Monitoring

### **AWS SES Monitoring**

1. Go to [SES Console](https://console.aws.amazon.com/ses/)
2. Click **"Account dashboard"**
3. View metrics:
   - Emails sent
   - Bounce rate (should be < 5%)
   - Complaint rate (should be < 0.1%)
   - Delivery rate

### **AWS SNS Monitoring**

1. Go to [SNS Console](https://console.aws.amazon.com/sns/)
2. Click **"Text messaging (SMS)"**
3. View **"Delivery logs"** for:
   - Sent messages
   - Delivery status
   - Failed messages

### **CloudWatch Logs**

1. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. Click **"Logs"** → **"Log groups"**
3. Search for:
   - `/aws/ses/*` - SES logs
   - `/aws/sns/*` - SNS logs

### **Vercel Function Logs**

1. Go to Vercel Dashboard
2. Select your project
3. Click **"Deployments"**
4. Click on latest deployment
5. View **"Function Logs"**

---

## 💰 Detailed Cost Breakdown

### **AWS SES Pricing**

- **First 62,000 emails/month:** FREE (if sent from EC2)
- **Standard pricing:** $0.10 per 1,000 emails
- **No monthly fees**
- **No setup costs**

**Examples:**
- 500 emails/month: **$0.05**
- 1,000 emails/month: **$0.10**
- 10,000 emails/month: **$1.00**
- 50,000 emails/month: **$5.00**

### **AWS SNS SMS Pricing (US)**

- **SMS to US numbers:** $0.00645 per message
- **No monthly fees**
- **No phone number rental**

**Examples:**
- 100 SMS/month: **$0.65**
- 500 SMS/month: **$3.23**
- 1,000 SMS/month: **$6.45**

### **Total Monthly Cost Estimates**

| Usage Level | Emails | SMS | SES Cost | SNS Cost | **Total** |
|-------------|--------|-----|----------|----------|-----------|
| **Small** | 500 | 50 | $0.05 | $0.32 | **$0.37/mo** |
| **Medium** | 2,000 | 200 | $0.20 | $1.29 | **$1.49/mo** |
| **Large** | 10,000 | 500 | $1.00 | $3.23 | **$4.23/mo** |
| **Enterprise** | 50,000 | 2,000 | $5.00 | $12.90 | **$17.90/mo** |

---

## ✅ Pre-Launch Checklist

### **AWS SES**
- [ ] AWS account created
- [ ] SES region selected (us-east-1 recommended)
- [ ] Sender email verified
- [ ] Production access requested and approved
- [ ] IAM user created with SES permissions
- [ ] Access key and secret key saved securely
- [ ] Environment variables added to Vercel
- [ ] Test email sent successfully
- [ ] Verified email deliverability

### **AWS SNS**
- [ ] SNS configured in same region as SES
- [ ] SMS preferences set to "Transactional"
- [ ] Spending limits configured
- [ ] IAM user has SNS permissions
- [ ] Access key and secret key saved securely
- [ ] Environment variables added to Vercel
- [ ] Test SMS sent successfully
- [ ] Verified SMS delivery

### **HIPAA Compliance**
- [ ] AWS BAA signed and uploaded
- [ ] Audit logging enabled
- [ ] PHI minimization practices documented
- [ ] Security policies reviewed
- [ ] Access controls documented

### **Deployment**
- [ ] All environment variables set in Vercel
- [ ] Application redeployed
- [ ] Email notifications tested end-to-end
- [ ] SMS notifications tested end-to-end
- [ ] Error handling verified
- [ ] Monitoring dashboards configured

---

## 📞 Support Resources

### **AWS SES**
- **Documentation:** https://docs.aws.amazon.com/ses/
- **Support:** https://aws.amazon.com/support/
- **Status:** https://status.aws.amazon.com/
- **Pricing:** https://aws.amazon.com/ses/pricing/

### **AWS SNS**
- **Documentation:** https://docs.aws.amazon.com/sns/
- **Support:** https://aws.amazon.com/support/
- **Pricing:** https://aws.amazon.com/sns/pricing/

### **AWS HIPAA Compliance**
- **Compliance:** https://aws.amazon.com/compliance/hipaa-compliance/
- **BAA:** Available through AWS Artifact

---

## 🎉 You're All Set!

Your Sessionably now has **reliable, cost-effective, HIPAA-compliant notifications** using:

✅ **AWS SES** for email (99%+ deliverability, $0.10 per 1,000 emails)
✅ **AWS SNS** for SMS ($0.00645 per SMS)
✅ **HIPAA compliant** with AWS BAA
✅ **Automatic failover** to demo mode if services unavailable
✅ **Full audit logging** for compliance
✅ **No vendor lock-in** - all open standards

**Total Setup Time:** 45-90 minutes
**Monthly Cost:** $0.50-5 for most practices
**Scalability:** Handles millions of messages

---

**Questions or Issues?**

Check the troubleshooting section above or review the Vercel function logs for detailed error messages. For AWS-specific issues, consult the AWS documentation or contact AWS support.
