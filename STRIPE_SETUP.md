# Stripe Payment Integration Setup Guide

## 🚀 Quick Setup Instructions

### 1. **Get Your Stripe Keys**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2. **Update Frontend with Publishable Key**

Edit `index.html` line 2891:

```javascript
// Replace with your actual Stripe publishable key
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');
```

### 3. **Add Environment Variables to Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Webhook signing secret (see step 4) |

### 4. **Set Up Webhook (Optional but Recommended)**

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.vercel.app/api/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### 5. **Deploy to Vercel**

```bash
git add .
git commit -m "Add Stripe payment integration"
git push origin main
```

Vercel will automatically deploy the new API endpoints.

---

## 📁 File Structure

```
clinicalspeak/
├── api/
│   ├── create-payment-intent.js  # Creates payment intents
│   └── webhook.js                 # Handles Stripe webhooks
├── index.html                     # Frontend with Stripe integration
└── STRIPE_SETUP.md               # This file
```

---

## 🧪 Testing

### Test Card Numbers

Use these test card numbers in Stripe test mode:

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined |
| `4000 0025 0000 3155` | Requires authentication |

**Test Details:**
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Test the Payment Flow

1. **Create an invoice** in the app
2. **Click "💳 Pay Now"** button
3. **Enter test card:** `4242 4242 4242 4242`
4. **Enter any future expiry date**
5. **Enter any CVC**
6. **Click "Pay"**
7. **Verify payment succeeds**

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use environment variables for secret keys
- ✅ Validate all input data
- ✅ Use HTTPS in production
- ✅ Verify webhook signatures
- ✅ Log all payment events
- ✅ Handle errors gracefully

### ❌ DON'T:
- ❌ Never expose secret keys in frontend code
- ❌ Never store card details locally
- ❌ Never skip webhook signature verification
- ❌ Never trust client-side data for payment amounts

---

## 📊 Payment Flow

```
User clicks "Pay Now"
    ↓
Frontend calls /api/create-payment-intent
    ↓
Backend creates Stripe Payment Intent
    ↓
Returns clientSecret to frontend
    ↓
Frontend confirms payment with Stripe
    ↓
Stripe processes payment
    ↓
Webhook notifies backend of result
    ↓
Invoice updated to "paid" status
```

---

## 🐛 Troubleshooting

### Payment Intent Creation Fails

**Error:** "Failed to create payment intent"

**Solutions:**
1. Check `STRIPE_SECRET_KEY` is set in Vercel
2. Verify secret key is correct
3. Check API endpoint is deployed
4. Review Vercel function logs

### Payment Confirmation Fails

**Error:** "Payment failed"

**Solutions:**
1. Check publishable key is correct in `index.html`
2. Verify card details are valid
3. Check Stripe Dashboard for error details
4. Ensure card is not blocked by bank

### Webhook Not Working

**Error:** Webhook events not received

**Solutions:**
1. Verify webhook URL is correct in Stripe Dashboard
2. Check `STRIPE_WEBHOOK_SECRET` is set
3. Ensure webhook endpoint is deployed
4. Test webhook with Stripe CLI

---

## 🔄 Going Live

### Switch from Test to Live Mode

1. **Get live API keys** from Stripe Dashboard
2. **Update environment variables** in Vercel:
   - `STRIPE_SECRET_KEY` → Live secret key
   - Update publishable key in `index.html`
3. **Update webhook endpoint** to live mode
4. **Test thoroughly** before going live
5. **Monitor** first few transactions

---

## 📈 Monitoring

### Stripe Dashboard

Monitor payments in real-time:
- **Payments** → View all transactions
- **Logs** → See API requests and errors
- **Webhooks** → Check webhook delivery status

### Vercel Logs

View function logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments**
4. Click on latest deployment
5. View **Function Logs**

---

## 💡 Additional Features

### Future Enhancements

- [ ] Save payment methods for recurring billing
- [ ] Subscription management
- [ ] Refund processing
- [ ] Payment plan support
- [ ] Multiple payment methods
- [ ] International payments

---

## 📞 Support

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com
- **Vercel Docs:** https://vercel.com/docs

---

## ✅ Checklist

Before going live, ensure:

- [ ] Stripe publishable key added to `index.html`
- [ ] Stripe secret key added to Vercel environment
- [ ] Webhook endpoint configured (optional)
- [ ] Test payments working correctly
- [ ] Error handling tested
- [ ] Audit logging functional
- [ ] Security measures in place
- [ ] Documentation reviewed

---

**Last Updated:** January 2024  
**Stripe Version:** 3.x  
**Vercel:** Serverless Functions

