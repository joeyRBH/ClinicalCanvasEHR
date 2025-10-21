# Twilio SMS Integration Setup Guide

## 🚀 Quick Setup Instructions

### 1. **Get Your Twilio Credentials**

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Dashboard**
3. Copy your credentials:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (starts with AC)
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (your auth token)
   - **Phone Number**: `+1XXXXXXXXXX` (your Twilio number)
   - **Messaging Service SID**: `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (starts with MG)

### 2. **Add Environment Variables to Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `clinicalcanvas`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Your Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | `+1XXXXXXXXXX` | Your Twilio phone number (with +1) |
| `TWILIO_MESSAGING_SERVICE_SID` | `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Your Messaging Service SID |

**Note:** Format phone number as `+1XXXXXXXXXX` (with country code)

### 3. **Deploy to Vercel**

```bash
git add .
git commit -m "Add Twilio SMS integration"
git push origin main
```

Vercel will automatically deploy the new API endpoint.

---

## 📁 File Structure

```
clinicalcanvas/
├── api/
│   └── send-sms.js          # Twilio SMS API endpoint
├── index.html                # Frontend with SMS notifications
└── TWILIO_SETUP.md          # This file
```

---

## 🧪 Testing

### Test SMS Sending

1. **Go to your site:** https://clinicalcanvas.vercel.app
2. **Login:** admin / admin123
3. **Create an invoice** for a client with a phone number
4. **Process a payment** or **mark invoice as paid**
5. **Check your phone** for SMS notification!

### Test Messages

SMS will be sent automatically for:
- ✅ **Payment Received** - "Payment Confirmed! We received $X.XX for invoice #XXX. Thank you!"
- ❌ **Payment Failed** - "Payment Failed: We couldn't process your payment for invoice #XXX..."
- 🔄 **Refund Processed** - "Refund Processed: A refund of $X.XX has been processed..."
- 📄 **Invoice Created** - "New Invoice: Invoice #XXX for $X.XX is ready. Due: MM/DD/YYYY..."

---

## 📊 SMS Notification Flow

```
User Action (Payment, Invoice, Refund)
    ↓
Frontend calls notifyPaymentReceived/notifyInvoiceCreated/etc.
    ↓
Calls sendSMSNotification(client_phone, message)
    ↓
POST request to /api/send-sms
    ↓
Twilio API sends SMS to client
    ↓
Client receives SMS notification
```

---

## 💰 Pricing

### Twilio SMS Pricing (US)

- **SMS to US numbers:** $0.0079 per message
- **Example:** 100 messages = $0.79
- **Monthly costs:**
  - 100 messages: ~$0.79
  - 500 messages: ~$3.95
  - 1,000 messages: ~$7.90

### Twilio Phone Number

- **Monthly cost:** $1.00/month
- Includes: 1 phone number for sending/receiving

### Total Monthly Cost Estimate

| Messages/Month | Phone Number | SMS Cost | Total |
|----------------|--------------|----------|-------|
| 100 | $1.00 | $0.79 | **$1.79** |
| 500 | $1.00 | $3.95 | **$4.95** |
| 1,000 | $1.00 | $7.90 | **$8.90** |

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use environment variables for credentials
- ✅ Use Messaging Service SID (better delivery)
- ✅ Validate phone numbers before sending
- ✅ Log all SMS activity for audit trail
- ✅ Handle errors gracefully
- ✅ Respect opt-out requests

### ❌ DON'T:
- ❌ Never expose Auth Token in frontend code
- ❌ Never hardcode credentials in files
- ❌ Never send SMS without user consent
- ❌ Never skip error handling

---

## 🐛 Troubleshooting

### SMS Not Sending

**Error:** "Failed to send SMS"

**Solutions:**
1. Check environment variables are set in Vercel
2. Verify Twilio credentials are correct
3. Check phone number format (must be E.164: +1XXXXXXXXXX)
4. Verify account has sufficient balance
5. Check Vercel function logs

### Invalid Phone Number

**Error:** "Invalid phone number format"

**Solutions:**
1. Ensure phone number includes country code (+1 for US)
2. Remove spaces, dashes, parentheses
3. Format: +1XXXXXXXXXX (11 digits total)

### Permission Denied

**Error:** "Permission denied to send to this number"

**Solutions:**
1. Number may be on opt-out list
2. Number may be landline (SMS not supported)
3. Check Twilio Console for restrictions

---

## 📈 Monitoring

### Twilio Dashboard

Monitor SMS activity:
- **Messaging** → **Logs** - View all sent messages
- **Messaging** → **Services** - Check delivery status
- **Monitor** → **Logs** - View API requests and errors

### Vercel Logs

View function logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments**
4. Click on latest deployment
5. View **Function Logs**

---

## 🔄 Going Live

### Switch from Test to Live Mode

1. **Get live credentials** from Twilio Console
2. **Update environment variables** in Vercel:
   - `TWILIO_ACCOUNT_SID` → Live Account SID
   - `TWILIO_AUTH_TOKEN` → Live Auth Token
   - `TWILIO_PHONE_NUMBER` → Live phone number
3. **Test thoroughly** before going live
4. **Monitor** first few messages

---

## 💡 Additional Features

### Future Enhancements

- [ ] SMS opt-in/opt-out preferences
- [ ] SMS appointment reminders
- [ ] Two-factor authentication via SMS
- [ ] SMS-based document access codes
- [ ] Automated payment reminders
- [ ] Delivery status tracking

---

## 📞 Support

- **Twilio Docs:** https://www.twilio.com/docs/sms
- **Twilio Support:** https://support.twilio.com
- **Vercel Docs:** https://vercel.com/docs

---

## ✅ Checklist

Before going live, ensure:

- [x] Twilio account created
- [x] Account SID and Auth Token obtained
- [x] Phone number purchased
- [x] Messaging Service created
- [x] Environment variables configured in Vercel
- [x] API endpoint deployed
- [x] Test SMS sent successfully
- [x] Error handling tested
- [x] Audit logging functional
- [x] Documentation reviewed

---

## 🎉 Integration Complete!

Your Twilio SMS integration is now live! Clients will receive SMS notifications for:
- Payment confirmations
- Payment failures
- Refund processing
- New invoices

**Status:** ✅ Production Ready  
**Last Updated:** January 2025  
**Twilio Version:** 5.x  
**Vercel:** Serverless Functions

---

**Questions or Issues?**  
Contact: Joey (GitHub: joeyRBH)  
Repository: github.com/joeyRBH/clinicalcanvas

