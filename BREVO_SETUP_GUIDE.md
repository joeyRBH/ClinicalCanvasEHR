# 📧 Brevo Email Setup Guide

**Updated:** October 17, 2024  
**Cost:** FREE tier (300 emails/day) + €25/month for 20,000 emails  
**Monthly Cost:** $0-27 (vs $50+ with SendGrid)

---

## 🎉 **Why Brevo?**

✅ **Generous Free Tier:** 300 emails/day (9,000/month)  
✅ **Affordable:** €25/month for 20,000 emails  
✅ **Reliable:** 99%+ deliverability  
✅ **Easy Setup:** 15 minutes  
✅ **Includes SMS:** Can handle both email and SMS  
✅ **HIPAA Compliant:** With BAA agreement  

---

## 🚀 **Quick Setup (15 minutes)**

### **Step 1: Create Brevo Account**

1. **Go to Brevo:**
   ```
   https://www.brevo.com/
   ```

2. **Sign Up:**
   - Click "Start for free"
   - Use your email
   - Create a password
   - Choose "Free" plan

3. **Complete Setup:**
   - Verify your email
   - Fill in your details
   - Choose "Transactional emails" as use case

### **Step 2: Get API Key**

1. **Go to SMTP & API:**
   ```
   https://app.brevo.com/settings/keys/api
   ```

2. **Create API Key:**
   - Click "Create a new API key"
   - Name: `ClinicalSpeak EHR`
   - Permissions: Select "Send emails"
   - Click "Create"
   - **COPY THE KEY** (starts with `xkeys-`)

### **Step 3: Verify Sender Email**

1. **Go to Senders:**
   ```
   https://app.brevo.com/settings/senders
   ```

2. **Add Sender:**
   - Click "Add a sender"
   - Email: `noreply@yourdomain.com` (or use your email)
   - Name: `ClinicalSpeak EHR`
   - Click "Add"
   - Check your email and click verification link

### **Step 4: Add to Vercel**

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Select Your Project:**
   - Click on `clinicalspeak`

3. **Go to Environment Variables:**
   - Click "Settings" tab
   - Click "Environment Variables"

4. **Add Variable:**
   - Key: `BREVO_API_KEY`
   - Value: `xkeys-your_api_key_here`
   - Environment: All (Production, Preview, Development)
   - Click "Save"

### **Step 5: Redeploy**

1. **Go to Deployments:**
   - Click "Deployments" tab

2. **Redeploy:**
   - Find the latest deployment
   - Click the three dots (⋯)
   - Click "Redeploy"
   - Wait for deployment to complete

---

## 🧪 **Testing**

### **Test Email (Demo Mode):**
Without Brevo configured, emails are logged to console:
```
📧 EMAIL (Demo Mode): {
  to: 'client@example.com',
  subject: 'Payment Received - Invoice INV-001',
  body: 'Dear Client...'
}
```

### **Test Email (Production):**
After configuring Brevo:
1. Trigger a payment event in your app
2. Check your inbox
3. Should receive email from Brevo

### **Verify Setup:**
```bash
curl https://clinicalspeak-git-main-joeyrbhs-projects.vercel.app/api/health
```

Expected response:
```json
{
  "services": {
    "email": true,  ← Should be true
    "sms": true,
    "stripe": true
  }
}
```

---

## 💰 **Cost Breakdown**

### **Free Tier (Perfect for Small Practices):**
- **300 emails/day** = 9,000 emails/month
- **Cost:** $0/month
- **Good for:** Practices with <100 active clients

### **Starter Plan (€25/month):**
- **20,000 emails/month**
- **Cost:** ~$27/month
- **Good for:** Medium practices (100-500 clients)

### **Professional Plan (€65/month):**
- **100,000 emails/month**
- **Cost:** ~$70/month
- **Good for:** Large practices (500+ clients)

---

## 📊 **Cost Comparison**

| Service | Free Tier | 10K emails/month | 50K emails/month |
|---------|-----------|------------------|------------------|
| **SendGrid** | 100/day | $19.95 | $19.95 |
| **Brevo** | 300/day | €25 (~$27) | €25 (~$27) |
| **Amazon SES** | 62K/month | $1 | $5 |
| **Mailgun** | 5K/month | $35 | $35 |

**Brevo wins for:**
- ✅ Generous free tier
- ✅ Predictable pricing
- ✅ Easy setup
- ✅ Good deliverability

---

## 🔧 **Advanced Features**

### **Email Templates:**
Brevo supports custom email templates:
1. Go to "Email Templates" in Brevo dashboard
2. Create templates for:
   - Payment confirmations
   - Appointment reminders
   - Invoice notifications
   - Document assignments

### **Analytics:**
Track email performance:
- Open rates
- Click rates
- Bounce rates
- Delivery status

### **A/B Testing:**
Test different email versions to improve engagement

---

## 🐛 **Troubleshooting**

### **Common Issues:**

**Problem:** "Invalid API key"
- **Solution:** Check API key is correct and has "Send emails" permission

**Problem:** "Sender not verified"
- **Solution:** Verify sender email in Brevo dashboard

**Problem:** "Account suspended"
- **Solution:** Check email content doesn't violate Brevo policies

**Problem:** "Rate limit exceeded"
- **Solution:** You've hit the 300 emails/day limit, upgrade plan

### **Getting Help:**
- **Brevo Support:** https://help.brevo.com/
- **Documentation:** https://developers.brevo.com/
- **Status Page:** https://status.brevo.com/

---

## 🔒 **Security & Compliance**

### **HIPAA Compliance:**
- Brevo can sign BAA (Business Associate Agreement)
- Contact Brevo support for HIPAA setup
- Ensure no PHI in email content

### **Best Practices:**
- ✅ Use HTTPS for all communications
- ✅ Store API keys securely (environment variables)
- ✅ Monitor email usage
- ✅ Regular security audits
- ✅ Keep API keys private

---

## 📈 **Monitoring & Analytics**

### **Brevo Dashboard:**
- Email delivery statistics
- Open and click rates
- Bounce and complaint rates
- Account usage

### **Integration Monitoring:**
- Check Vercel function logs
- Monitor API response times
- Track email delivery success rates

---

## 🚀 **Going Live Checklist**

- [ ] Brevo account created
- [ ] API key generated
- [ ] Sender email verified
- [ ] `BREVO_API_KEY` added to Vercel
- [ ] App redeployed
- [ ] Health check shows `"email": true`
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] BAA signed with Brevo (if handling PHI)
- [ ] Monitoring set up

---

## 🎯 **Expected Results**

After setup, you should see:

1. **Health Check:**
   ```json
   {
     "services": {
       "email": true,
       "sms": true,
       "stripe": true
     }
   }
   ```

2. **Email Delivery:**
   - Payment notifications sent automatically
   - Invoice alerts delivered
   - Appointment reminders working
   - Document assignment notifications sent

3. **Cost Savings:**
   - $0-27/month vs $50+ with SendGrid
   - 70-80% cost reduction
   - Predictable pricing

---

## 📞 **Support**

### **Brevo Support:**
- **Email:** support@brevo.com
- **Help Center:** https://help.brevo.com/
- **Live Chat:** Available in Brevo dashboard

### **Technical Issues:**
- Check Vercel function logs
- Verify environment variables
- Test API key permissions
- Check sender verification status

---

**Setup Time:** 15 minutes  
**Monthly Cost:** $0-27  
**Annual Savings:** $240-600+  
**Reliability:** 99%+ deliverability  

**Brevo is the perfect choice for cost-effective, reliable email delivery!** 🎉📧
