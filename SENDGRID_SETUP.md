# SendGrid Setup Guide for ClinicalCanvas EHR

## Overview

SendGrid will handle:
- ✅ **Email:** Appointment reminders, invoices, notifications
- ✅ **SMS:** Appointment reminders, urgent notifications

Both services are HIPAA compliant with a single BAA.

---

## Step 1: Create SendGrid Account

1. **Go to SendGrid:** [https://signup.sendgrid.com/](https://signup.sendgrid.com/)

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

## Step 2: Request HIPAA BAA from SendGrid

**IMPORTANT:** You must request a BAA before using SendGrid with PHI.

### How to Request BAA:

1. **Log into SendGrid Dashboard**
2. **Go to Settings → Account Details**
3. **Click "Contact Sales" or "Support"**
4. **Request HIPAA BAA** with this message:

```
Subject: HIPAA Business Associate Agreement Request

Hello SendGrid Support,

I am setting up ClinicalCanvas EHR, a HIPAA-compliant electronic health records 
platform for mental health professionals. I need to request a Business Associate 
Agreement (BAA) to use SendGrid for sending emails and SMS messages that may 
contain Protected Health Information (PHI).

Account Email: [your-sendgrid-email@example.com]
Company: ClinicalCanvas EHR
Use Case: Appointment reminders, invoices, clinical notifications

Please provide a BAA for both Email and SMS services.

Thank you,
Joey Holub
```

**Response Time:** Usually 1-3 business days

---

## Step 3: Set Up Email Sending

### 3a) Create API Key

1. **Go to:** Settings → API Keys
2. **Click:** "Create API Key"
3. **Name:** `ClinicalCanvas-Production`
4. **Permissions:** Full Access (or "Restricted Access" with Mail Send + SMS permissions)
5. **Click:** "Create & View"
6. **COPY THE KEY** - You won't see it again!
   - Example: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3b) Verify Sender Identity

**Option 1: Single Sender Verification (Easiest for Testing)**

1. **Go to:** Settings → Sender Authentication
2. **Click:** "Verify a Single Sender"
3. **Fill out form:**
   - From Email Address: `noreply@clinicalcanvas.com` (or your email)
   - From Sender Name: `ClinicalCanvas EHR`
   - Reply To: `support@clinicalcanvas.com`
   - Company Address: (your address)
   - City, State, Zip: (your location)
   - Country: United States
4. **Click:** "Create"
5. **Check email** and click verification link

**Option 2: Domain Authentication (Best for Production)**

1. **Go to:** Settings → Sender Authentication
2. **Click:** "Authenticate Your Domain"
3. **Enter your domain:** `clinicalcanvas.app`
4. **Choose DNS Provider:** (your provider, e.g., Namecheap, GoDaddy, Vercel)
5. **Add DNS records** to your domain (see DNS records section below)
6. **Verify** (takes 24-48 hours)

### DNS Records to Add

Add these DNS records to your `clinicalcanvas.app` domain:

**CNAME Records:**
```
Host: url377.clinicalcanvas.app
Value: sendgrid.net

Host: 56807755.clinicalcanvas.app
Value: sendgrid.net

Host: em2009.clinicalcanvas.app
Value: u56807755.wl006.sendgrid.net

Host: s1._domainkey.clinicalcanvas.app
Value: s1.domainkey.u56807755.wl006.sendgrid.net

Host: s2._domainkey.clinicalcanvas.app
Value: s2.domainkey.u56807755.wl006.sendgrid.net
```

**TXT Record:**
```
Host: _dmarc.clinicalcanvas.app
Value: v=DMARC1; p=none;
```

**What Each Record Does:**
- `url377.clinicalcanvas.app` - Link tracking for emails
- `56807755.clinicalcanvas.app` - Verification record
- `em2009.clinicalcanvas.app` - Email subdomain for sending
- `s1._domainkey` & `s2._domainkey` - DKIM authentication keys
- `_dmarc` - DMARC policy for email authentication

---

## Step 4: Set Up SMS Sending

### 4a) Enable SMS in SendGrid

1. **Go to:** Settings → SMS
2. **Click:** "Get Started with SMS"
3. **Verify Phone Number:**
   - Enter your phone number
   - Receive verification code via SMS
   - Enter code to verify

### 4b) Get SMS API Key

1. **Go to:** Settings → API Keys
2. **Find your existing key** (or create a new one)
3. **Make sure it has SMS permissions**

### 4c) Get Phone Number (Optional)

SendGrid can provide a dedicated phone number for SMS:
- **Cost:** ~$2-5/month per number
- **Use case:** Professional SMS from a dedicated number

**To get a phone number:**
1. **Go to:** Settings → SMS → Phone Numbers
2. **Click:** "Buy a Number"
3. **Choose area code** (e.g., your local area)
4. **Complete purchase**

---

## Step 5: Get Your Credentials

After setup, you'll need these values:

### Email Credentials:
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@clinicalcanvas.com
SENDGRID_FROM_NAME=ClinicalCanvas EHR
```

### SMS Credentials:
```
SENDGRID_SMS_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_SMS_FROM_NUMBER=+1234567890 (your SendGrid phone number)
```

**Note:** You can use the same API key for both email and SMS!

---

## Step 6: Add to Vercel

Once you have your credentials:

1. **Go to Vercel Dashboard:** [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. **Select your project:** `clinicalspeak`
3. **Go to:** Settings → Environment Variables
4. **Add these variables:**

```
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@clinicalcanvas.com
SENDGRID_FROM_NAME=ClinicalCanvas EHR
SENDGRID_SMS_FROM_NUMBER=+1234567890
```

5. **Click:** "Save"
6. **Redeploy** your site (Vercel will auto-deploy or you can manually redeploy)

---

## Step 7: Remove Twilio (Cleanup)

After SendGrid is working, we'll remove Twilio:

1. Remove `twilio` from `package.json`
2. Delete `api/send-sms.js` (will be replaced with SendGrid version)
3. Remove Twilio environment variables from Vercel
4. Update documentation

---

## Pricing

### Email:
- **Free Tier:** 100 emails/day forever
- **Essentials Plan:** $19.95/month for 50,000 emails
- **Pro Plan:** $89.95/month for 100,000 emails

### SMS:
- **Per SMS:** $0.0075 per message (US)
- **1,000 SMS/month:** ~$7.50
- **Phone Number:** ~$2-5/month (optional)

### Total Monthly Cost:
- **Small Practice:** ~$27-32/month (50K emails + 1K SMS)
- **Medium Practice:** ~$97-102/month (100K emails + 2K SMS)

---

## Testing

After setup, I'll create test pages for you:
- `/test-sendgrid-email` - Test email sending
- `/test-sendgrid-sms` - Test SMS sending

---

## Next Steps

1. ✅ Create SendGrid account
2. ✅ Request HIPAA BAA
3. ✅ Create API key
4. ✅ Verify sender email
5. ✅ Set up SMS (verify phone)
6. ✅ Send me your credentials
7. ✅ I'll update the code
8. ✅ Test email and SMS
9. ✅ Remove Twilio

---

## Support

- **SendGrid Docs:** [https://docs.sendgrid.com/](https://docs.sendgrid.com/)
- **SendGrid Support:** [https://support.sendgrid.com/](https://support.sendgrid.com/)
- **BAA Request:** Contact support directly

---

**Ready to start?** Go to [https://signup.sendgrid.com/](https://signup.sendgrid.com/) and let me know when you have your API key!

