# Brevo Setup Guide for ClinicalCanvas EHR

## Overview

Brevo (formerly Sendinblue) will handle:
- ✅ **Email:** Appointment reminders, invoices, notifications, onboarding
- ✅ **SMS:** Appointment reminders, urgent notifications, document reminders

Both services are available through a single platform with HIPAA compliance options.

---

## Step 1: Create Brevo Account

1. **Go to Brevo:** [https://www.brevo.com/](https://www.brevo.com/)

2. **Sign Up:**
   - Enter your email address
   - Create a password
   - Verify your email

3. **Complete Profile:**
   - Company name: ClinicalCanvas EHR
   - First name: Joey
   - Last name: Holub
   - Phone number: (your number)

4. **Verify Your Account:**
   - Check your email for verification link
   - Click to verify

---

## Step 2: Request HIPAA BAA from Brevo

**IMPORTANT:** You must request a BAA before using Brevo with PHI.

### How to Request BAA:

1. **Log into Brevo Dashboard**
2. **Go to Account Settings → Legal**
3. **Click "Contact Support"**
4. **Request HIPAA BAA** with this message:

```
Subject: HIPAA Business Associate Agreement Request

Hello Brevo Support,

I am setting up ClinicalCanvas EHR, a HIPAA-compliant electronic health records 
platform for mental health professionals. I need to request a Business Associate 
Agreement (BAA) to use Brevo for sending emails and SMS messages that may 
contain Protected Health Information (PHI).

Account Email: [your-brevo-email@example.com]
Company: ClinicalCanvas EHR
Use Case: Appointment reminders, invoices, clinical notifications, patient communications

Please provide a BAA for both Email and SMS services.

Thank you,
Joey Holub
```

**Response Time:** Usually 2-5 business days

---

## Step 3: Set Up Email Sending

### 3a) Create API Key

1. **Go to:** Settings → API Keys
2. **Click:** "Generate New API Key"
3. **Name:** `ClinicalCanvas-Production`
4. **Permissions:** 
   - ✅ Transactional Emails (Send)
   - ✅ Transactional SMS (Send)
   - ✅ Account (Read) - Optional
5. **Click:** "Generate"
6. **COPY THE KEY** - You won't see it again!
   - Example: `xkeys-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3b) Verify Sender Identity

**Option 1: Single Sender Verification (Easiest for Testing)**

1. **Go to:** Senders & IP → Senders
2. **Click:** "Add New Sender"
3. **Fill out form:**
   - From Email Address: `noreply@clinicalcanvas.com` (or your email)
   - From Sender Name: `ClinicalCanvas EHR`
   - Reply To: `support@clinicalcanvas.com`
   - Company Address: (your address)
   - City, State, Zip: (your location)
   - Country: United States
4. **Click:** "Add Sender"
5. **Check email** and click verification link

**Option 2: Domain Authentication (Best for Production)**

1. **Go to:** Senders & IP → Domains
2. **Click:** "Add Domain"
3. **Enter your domain:** `clinicalcanvas.com` (or your domain)
4. **Add DNS records** to your domain (Brevo will show you exactly what to add)
5. **Verify** (takes 24-48 hours)

---

## Step 4: Set Up SMS Sending

### 4a) Enable SMS in Brevo

1. **Go to:** SMS → SMS Campaigns
2. **Click:** "Get Started with SMS"
3. **Verify Phone Number:**
   - Enter your phone number
   - Receive verification code via SMS
   - Enter code to verify

### 4b) Get SMS Sender ID

1. **Go to:** SMS → Settings
2. **Set Sender ID:** `ClinicalCanvas` (or your practice name)
3. **Note:** This will appear as the sender for SMS messages

### 4c) Get Dedicated Phone Number (Optional)

Brevo can provide a dedicated phone number for SMS:
- **Cost:** ~$2-5/month per number
- **Use case:** Professional SMS from a dedicated number

**To get a phone number:**
1. **Go to:** SMS → Settings → Phone Numbers
2. **Click:** "Buy a Number"
3. **Choose area code** (e.g., your local area)
4. **Complete purchase**

---

## Step 5: Get Your Credentials

After setup, you'll need these values:

### Email Credentials:
```
BREVO_API_KEY=xkeys-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_FROM_EMAIL=noreply@clinicalcanvas.com
BREVO_FROM_NAME=ClinicalCanvas EHR
```

### SMS Credentials:
```
BREVO_SMS_FROM_NUMBER=+1234567890 (your Brevo phone number, optional)
BREVO_SMS_SENDER_ID=ClinicalCanvas (your sender ID)
```

**Note:** You can use the same API key for both email and SMS!

---

## Step 6: Add to Vercel

Once you have your credentials:

1. **Go to Vercel Dashboard:** [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. **Select your project:** `clinicalcanvas`
3. **Go to:** Settings → Environment Variables
4. **Add these variables:**

```
BREVO_API_KEY=xkeys-your_actual_api_key_here
BREVO_FROM_EMAIL=noreply@clinicalcanvas.com
BREVO_FROM_NAME=ClinicalCanvas EHR
BREVO_SMS_FROM_NUMBER=+1234567890
BREVO_SMS_SENDER_ID=ClinicalCanvas
```

5. **Click:** "Save"
6. **Redeploy** your site (Vercel will auto-deploy or you can manually redeploy)

---

## Step 7: Remove Old Dependencies (Cleanup)

After Brevo is working, we'll remove SendGrid and Twilio:

1. Remove `@sendgrid/mail` and `twilio` from `package.json`
2. Delete old SendGrid/Twilio files
3. Remove old environment variables from Vercel
4. Update documentation

---

## Pricing

### Email:
- **Free Plan:** 300 emails/day forever
- **Starter Plan:** $9/month for 20,000 emails
- **Business Plan:** $65/month for 100,000 emails
- **Enterprise:** Custom pricing for high volume

### SMS:
- **Per SMS:** $0.05 per message (US)
- **1,000 SMS/month:** ~$50
- **Phone Number:** ~$2-5/month (optional)

### Total Monthly Cost:
- **Small Practice:** ~$59-64/month (20K emails + 1K SMS)
- **Medium Practice:** ~$115-120/month (100K emails + 2K SMS)

---

## Testing

After setup, I'll create test endpoints for you:
- `/api/send-email` - Test email sending
- `/api/send-sms` - Test SMS sending

---

## Supported Email Types

1. **Welcome Email** - New user onboarding
2. **Appointment Reminder** - Automated reminders
3. **Invoice Email** - Billing notifications
4. **General Email** - Custom messages

## Supported SMS Types

1. **Appointment Reminder** - Automated SMS reminders
2. **Payment Reminder** - Billing SMS notifications
3. **Urgent Notification** - Emergency communications
4. **Document Reminder** - Form completion reminders
5. **General SMS** - Custom messages

---

## Next Steps

1. ✅ Create Brevo account
2. ✅ Request HIPAA BAA
3. ✅ Create API key
4. ✅ Verify sender email
5. ✅ Set up SMS (verify phone)
6. ✅ Send me your credentials
7. ✅ I'll update the code
8. ✅ Test email and SMS
9. ✅ Remove SendGrid/Twilio

---

## Support

- **Brevo Docs:** [https://developers.brevo.com/](https://developers.brevo.com/)
- **Brevo Support:** [https://help.brevo.com/](https://help.brevo.com/)
- **BAA Request:** Contact support directly

---

**Ready to start?** Go to [https://www.brevo.com/](https://www.brevo.com/) and let me know when you have your API key!
