# Twilio Messaging Service Setup

## Overview
The application now uses Twilio's **Messaging Service SID** instead of a phone number for better deliverability and features.

**Messaging Service SID:** `MGe922e50caf181bb044f877d9dba8c649`

## Benefits of Messaging Service

✅ **Better Deliverability** - Automatic routing and fallback
✅ **Sender Pool** - Multiple phone numbers for high volume
✅ **Geo-Matching** - Automatic local number selection
✅ **Link Shortening** - Automatic URL shortening
✅ **Sticky Sender** - Same number for conversation threads

---

## Setup Instructions

### 1. Add Environment Variable to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **ClinicalCanvasEHR** project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variable:

```
Name: TWILIO_MESSAGING_SERVICE_SID
Value: MGe922e50caf181bb044f877d9dba8c649
```

5. Select environments: **Production**, **Preview**, and **Development**
6. Click **Save**

### 2. Redeploy Application

After adding the environment variable, trigger a new deployment:

**Option A - Automatic (recommended):**
```bash
git push origin main
```

**Option B - Manual:**
- Go to **Deployments** tab in Vercel
- Click **Redeploy** on the latest deployment

### 3. Verify Configuration

After deployment, check the health endpoint:
```
https://your-app.vercel.app/api/health
```

Look for the SMS configuration section:
```json
{
  "sms": true,
  "sms_provider": "Twilio",
  "sms_service": "Messaging Service"
}
```

---

## How It Works

### Updated Code Logic

The `sendSMS()` function in `/api/utils/notifications.js` now:

1. **Checks for Messaging Service SID first** (preferred method)
   ```javascript
   if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
       messageParams.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
   }
   ```

2. **Falls back to phone number** (legacy method)
   ```javascript
   else if (process.env.TWILIO_PHONE_NUMBER) {
       messageParams.from = process.env.TWILIO_PHONE_NUMBER;
   }
   ```

3. **Throws error if neither is configured**

### Example Usage - Auth Code SMS

When a document is assigned to a client:

```javascript
// Auth code generated: ABCD-12345678
const smsBody = `Your ClinicalCanvas access code: ${authCode}
Visit: https://your-app.vercel.app
This code expires in 30 days.`;

await sendSMS({
    to: client.phone,  // e.g., +15551234567
    body: smsBody
});
```

The SMS will be sent through the Messaging Service with:
- Automatic sender selection
- Link shortening (if enabled)
- Delivery tracking
- Geo-matched phone number

---

## Testing

### Test SMS Sending

Use the test endpoint:
```bash
curl -X POST https://your-app.vercel.app/api/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+15551234567",
    "body": "Test message from ClinicalCanvas EHR"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "messageId": "SMxxxxxxxxxxxxxxxxxxxxx",
  "status": "queued"
}
```

### Check Twilio Logs

1. Go to [Twilio Console](https://console.twilio.com/us1/monitor/logs/sms)
2. Filter by your Messaging Service SID
3. Verify messages are being sent successfully

---

## Troubleshooting

### Error: "Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is configured"

**Solution:**
- Verify environment variable is set in Vercel
- Redeploy the application
- Check spelling: `TWILIO_MESSAGING_SERVICE_SID`

### Error: "Unable to create record: The 'From' number is not a valid phone number"

**Cause:** Messaging Service SID is not properly configured

**Solution:**
1. Verify the Messaging Service exists in Twilio Console
2. Check that the Service has at least one sender (phone number)
3. Verify the Service SID is correct: `MGe922e50caf181bb044f877d9dba8c649`

### Messages Not Sending

**Checklist:**
- [ ] Twilio Account SID and Auth Token are correct
- [ ] Messaging Service SID is correct
- [ ] Messaging Service has active phone numbers
- [ ] Recipient phone number is in E.164 format (+15551234567)
- [ ] Twilio account has sufficient balance
- [ ] Check [Twilio Error Logs](https://console.twilio.com/us1/monitor/logs/errors)

---

## Migration Notes

### Old Configuration (Phone Number)
```env
TWILIO_PHONE_NUMBER=+15551234567
```

### New Configuration (Messaging Service)
```env
TWILIO_MESSAGING_SERVICE_SID=MGe922e50caf181bb044f877d9dba8c649
```

**Backward Compatible:** The code will automatically use the Messaging Service if available, otherwise fall back to the phone number.

**To Migrate:**
1. Add `TWILIO_MESSAGING_SERVICE_SID` to Vercel
2. Keep `TWILIO_PHONE_NUMBER` as backup (optional)
3. Redeploy
4. Test SMS functionality
5. Remove `TWILIO_PHONE_NUMBER` after verifying (optional)

---

## Features Using SMS

The following features send SMS notifications:

1. **Document Access Codes** - When assigning documents to clients
2. **Appointment Reminders** - 24 hours before appointments
3. **Payment Confirmations** - After successful payments
4. **Invoice Notifications** - When new invoices are created
5. **Password Reset** - Security codes for password resets

All SMS messages now route through the Messaging Service for improved reliability.

---

## Support

**Twilio Support:** https://support.twilio.com
**Messaging Service Dashboard:** https://console.twilio.com/us1/develop/sms/services/MGe922e50caf181bb044f877d9dba8c649

**Questions?** Check the Twilio documentation:
- [Messaging Services Overview](https://www.twilio.com/docs/messaging/services)
- [Best Practices](https://www.twilio.com/docs/messaging/guides/best-practices)
