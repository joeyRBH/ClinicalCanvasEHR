# Next Steps: Twilio SMS & SendGrid Monitoring

## Task 1: Configure Twilio for SMS

### What You Need:

From your Twilio account, get these 3 credentials:

1. **Account SID** - Starts with `AC...`
2. **Auth Token** - Your secret token
3. **Phone Number** - Format: `+1234567890` (must include +1)

### Where to Find Them:

**Go to:** [https://console.twilio.com/](https://console.twilio.com/)

**On the Dashboard, you'll see:**
- Account Info section with Account SID and Auth Token
- Phone Number in "Trial Number" or "Active Numbers"

### Add to Vercel:

1. **Go to:** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Select:** clinicalcanvas project
3. **Navigate to:** Settings → Environment Variables
4. **Add these 3 variables:**

```
Variable Name: TWILIO_ACCOUNT_SID
Value: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Variable Name: TWILIO_AUTH_TOKEN  
Value: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Variable Name: TWILIO_PHONE_NUMBER
Value: +1234567890
```

5. **Click "Save"** after each one
6. Vercel will auto-redeploy (takes 2-3 minutes)

### Test SMS (After Deploy):

Your app will automatically use Twilio when the environment variables are set. The `api/utils/notifications.js` file already has Twilio integration ready.

**Test it by using:**
```javascript
const { sendSMS } = require('./api/utils/notifications');

await sendSMS({
    to: '+1234567890',
    body: 'Test SMS from ClinicalCanvas!'
});
```

---

## Task 2: Monitor SendGrid Usage

### SendGrid Dashboard:

**Go to:** [https://app.sendgrid.com/](https://app.sendgrid.com/)

### Key Pages to Monitor:

#### 1. **Statistics Overview**
**URL:** https://app.sendgrid.com/statistics

**What to Check:**
- ✅ Delivered emails
- ❌ Bounces (invalid email addresses)
- ⚠️ Spam reports
- 📊 Open rates (if tracking enabled)
- 📊 Click rates (if tracking enabled)

**Look For:**
- High delivery rate (>95% is good)
- Low bounce rate (<5%)
- Zero spam reports (or very low)

#### 2. **Activity Feed**
**URL:** https://app.sendgrid.com/activity

**What to Check:**
- Real-time email sending activity
- Delivery status of recent emails
- Any errors or bounces

**Use This To:**
- Verify test emails were sent
- Troubleshoot delivery issues
- See detailed delivery information

#### 3. **Sender Authentication**
**URL:** https://app.sendgrid.com/settings/sender_auth

**What to Check:**
- ✅ Domain authentication status (should show "Verified")
- ✅ Your domain: clinicalcanvas.app
- DNS records status

**This Should Show:**
- All DNS records verified
- Green checkmarks next to each record

#### 4. **Account Details & Usage**
**URL:** https://app.sendgrid.com/account/details

**What to Check:**
- Current plan (Free/Essentials/Pro)
- Email sends this month
- Remaining emails in your plan

**Free Plan Limits:**
- 100 emails/day
- 3,000 emails/month total

**When to Upgrade:**
- If you need more than 100 emails/day
- If you need dedicated IP
- If you need priority support

#### 5. **Alerts & Notifications**
**URL:** https://app.sendgrid.com/settings/alerts

**Set Up Alerts For:**
- Usage hitting 75% of limit
- Bounce rate above 5%
- Spam reports
- Invalid email addresses

**How to Set Up:**
1. Click "Create New Alert"
2. Choose alert type (e.g., "Percentage of Usage")
3. Set threshold (e.g., 75%)
4. Add your email
5. Save

### Recommended Monitoring Schedule:

**Daily (First Week):**
- Check Statistics → View delivery rates
- Review Activity Feed → Verify emails are sending

**Weekly (Ongoing):**
- Review Statistics → Check trends
- Check Account Usage → Monitor limits
- Review any bounces or spam reports

**Monthly:**
- Review full month statistics
- Decide if plan upgrade is needed
- Clean up any invalid email addresses

### Key Metrics to Watch:

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| Delivery Rate | >95% | 90-95% | <90% |
| Bounce Rate | <5% | 5-10% | >10% |
| Spam Rate | <0.1% | 0.1-0.5% | >0.5% |

### What to Do If You See Issues:

**High Bounce Rate:**
- Verify email addresses before sending
- Remove invalid addresses from database
- Check for typos in email addresses

**Spam Reports:**
- Make sure emails are expected by recipients
- Include clear unsubscribe link
- Don't send too frequently

**Low Delivery Rate:**
- Check DNS records are still verified
- Review email content (avoid spam triggers)
- Contact SendGrid support

---

## Quick Reference Links:

### Twilio:
- Console: https://console.twilio.com/
- Messaging Logs: https://console.twilio.com/monitor/logs/sms
- Usage: https://console.twilio.com/usage

### SendGrid:
- Statistics: https://app.sendgrid.com/statistics
- Activity: https://app.sendgrid.com/activity
- Settings: https://app.sendgrid.com/settings/sender_auth
- Support: https://support.sendgrid.com/

---

## Summary Checklist:

### Twilio Setup:
- [ ] Log into Twilio Console
- [ ] Copy Account SID
- [ ] Copy Auth Token
- [ ] Copy Phone Number (format: +1234567890)
- [ ] Add all 3 to Vercel environment variables
- [ ] Wait for Vercel to redeploy
- [ ] Test SMS sending

### SendGrid Monitoring:
- [ ] Log into SendGrid Dashboard
- [ ] Check Statistics page (delivery rates)
- [ ] Review Activity Feed (recent sends)
- [ ] Verify Domain Authentication (still verified)
- [ ] Check Account Usage (plan limits)
- [ ] Set up usage alerts
- [ ] Bookmark key pages for regular monitoring

---

**Time Required:**
- Twilio Setup: ~10 minutes
- SendGrid Monitoring Setup: ~15 minutes
- Ongoing Monitoring: ~5 minutes/week

**Status:** Ready to configure!
