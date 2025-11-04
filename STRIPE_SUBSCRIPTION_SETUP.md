# Stripe Subscription Setup Guide
## ClinicalCanvas EHR - Three-Tier Pricing

**Last Updated:** November 4, 2025
**Status:** Ready for Production Setup

---

## 📊 Overview

ClinicalCanvas uses a three-tier modular pricing model with Stripe subscriptions:

```
┌──────────────────────────────────────────────────────┐
│  Essential EHR          $35/month                   │
│  Professional           $50/month (with add-on)      │
│  Complete Suite         $65/month                    │
└──────────────────────────────────────────────────────┘
```

### Subscription Features

- **14-day free trial** (no credit card required)
- **Monthly billing** (recurring)
- **Automatic payment collection** after trial
- **Webhook sync** for real-time status updates
- **Easy plan switching** (upgrade/downgrade)

---

## 🎯 Stripe Products to Create

You need to create **4 products** in Stripe Dashboard:

### 1. Essential EHR - $35/month
```
Product Name: ClinicalCanvas Essential EHR
Description: Core EHR features for mental health professionals
Price: $35.00 USD / month
Billing: Recurring monthly
Trial: 14 days
```

### 2. Professional (Telehealth) - $50/month
```
Product Name: ClinicalCanvas Professional + Telehealth
Description: EHR + Video telehealth sessions
Price: $50.00 USD / month
Billing: Recurring monthly
Trial: 14 days
```

### 3. Professional (AI Notes) - $50/month
```
Product Name: ClinicalCanvas Professional + AI Notes
Description: EHR + AI-powered clinical documentation
Price: $50.00 USD / month
Billing: Recurring monthly
Trial: 14 days
```

### 4. Complete Suite - $65/month
```
Product Name: ClinicalCanvas Complete Suite
Description: Full platform with telehealth + AI notes
Price: $65.00 USD / month
Billing: Recurring monthly
Trial: 14 days
```

---

## 🛠️ Step-by-Step Setup Instructions

### Step 1: Create Products in Stripe Dashboard

1. **Go to:** https://dashboard.stripe.com/products
2. **Click:** "Add Product" button
3. **For each product above:**
   - Enter product name and description
   - Add price: $35, $50, $50, or $65
   - Select: "Recurring" payment
   - Interval: "Monthly"
   - Click: "Add product"

### Step 2: Get Price IDs

After creating each product, Stripe will generate a Price ID (starts with `price_`).

**Example:**
```
Essential: price_1ABC2DEfghijKLMN3456
Professional + Telehealth: price_1XYZ9ABCdefghijk7890
Professional + AI Notes: price_1QRS5TUVwxyzABCD1234
Complete: price_1MNO6PQRstuvwxyz5678
```

**Copy all 4 Price IDs** - you'll need them for environment variables.

### Step 3: Configure Vercel Environment Variables

Add these to your Vercel project (Settings → Environment Variables):

```bash
# Stripe Subscription Price IDs (get from Stripe Dashboard)
STRIPE_PRICE_ESSENTIAL=price_1ABC2DEfghijKLMN3456
STRIPE_PRICE_PROFESSIONAL_TELEHEALTH=price_1XYZ9ABCdefghijk7890
STRIPE_PRICE_PROFESSIONAL_AI=price_1QRS5TUVwxyzABCD1234
STRIPE_PRICE_COMPLETE=price_1MNO6PQRstuvwxyz5678

# Existing Stripe keys (should already be set)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Test in Stripe Test Mode

Before going live, test with Stripe test mode:

1. Switch Stripe dashboard to "Test mode" (toggle in top-right)
2. Create test products with same pricing
3. Get test Price IDs (start with `price_test_`)
4. Add to Vercel as test environment variables
5. Use test credit card: `4242 4242 4242 4242`

---

## 💳 Subscription Workflow

### New User Signup Flow

```
1. User fills signup form on website
   ↓
2. Selects plan: Essential, Professional, or Complete
   ↓
3. POST /api/create-account
   ↓
4. System creates:
   • Stripe customer
   • Stripe subscription (with 14-day trial)
   • User account in database
   • Practice settings record
   ↓
5. User gets access immediately
   ↓
6. Trial ends after 14 days
   ↓
7. Stripe automatically charges payment method
   ↓
8. Webhook updates invoice status in database
```

### Trial Period Behavior

**Days 1-14 (Trial Period):**
- ✅ Full access to all features in selected plan
- ✅ No payment required
- ✅ No credit card required to start
- ⚠️ User gets email reminder at day 10 (future feature)

**Day 14 (Trial End):**
- 🔔 User receives email: "Trial ending soon"
- 🔔 Prompt to add payment method
- ❌ If no payment method: Access suspended

**Day 15+ (After Trial):**
- 💳 Stripe attempts to charge payment method
- ✅ If successful: Access continues
- ❌ If failed: Account suspended, retry in 3 days

---

## 🔄 Plan Management

### Upgrading a Plan

User wants to go from Essential ($35) → Complete ($65):

1. Call `POST /api/manage-subscription`
2. Stripe calculates prorated amount
3. User charged difference immediately
4. New features activate instantly

**Example:**
- User on Essential for 15 days
- Upgrades to Complete
- Prorated charge: ~$15 (for remaining 15 days)
- Next full charge: $65 on renewal date

### Downgrading a Plan

User wants to go from Complete ($65) → Essential ($35):

1. Call `POST /api/manage-subscription`
2. Downgrade scheduled for next billing cycle
3. User keeps Complete features until then
4. On renewal: Charged $35, features reduced

**Why delay downgrade?**
- User already paid for current month
- Fair to let them use what they paid for
- Reduces refund requests

### Canceling Subscription

User wants to cancel:

1. Call `POST /api/manage-subscription` with cancel action
2. Cancellation scheduled for end of billing period
3. User keeps access until then
4. No refund for current period (standard practice)

---

## 📧 Email Notifications (Future)

Recommended automated emails:

```javascript
1. Welcome Email (Day 0)
   • "Welcome to ClinicalCanvas!"
   • Getting started guide
   • Support contact info

2. Trial Reminder (Day 10)
   • "4 days left in your trial"
   • Prompt to add payment method
   • Link to billing settings

3. Trial Ending (Day 13)
   • "Your trial ends tomorrow"
   • Add payment method to continue
   • What happens if payment fails

4. Payment Succeeded (Day 15+)
   • "Thank you for your payment"
   • Receipt attached
   • Current plan details

5. Payment Failed (Day 15+ if fails)
   • "Payment unsuccessful"
   • Update payment method
   • Access will be suspended in 3 days

6. Subscription Upgraded
   • "You're now on [Plan Name]"
   • New features available
   • Updated billing info

7. Subscription Downgraded
   • "Plan change confirmed"
   • Effective date: [Next billing cycle]
   • Features remaining until then

8. Subscription Cancelled
   • "We're sorry to see you go"
   • Access until: [End of billing period]
   • Feedback survey (optional)
```

---

## 🎨 Stripe Checkout vs Custom Flow

### Option A: Stripe Checkout (Recommended for MVP)

**Pros:**
- ✅ Handles payment collection automatically
- ✅ PCI compliant (no card data on your server)
- ✅ Mobile optimized
- ✅ Supports Apple Pay, Google Pay
- ✅ Less code to maintain

**Cons:**
- ⚠️ User redirected to Stripe page
- ⚠️ Less customization

**Implementation:**
```javascript
// After creating subscription
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomer.id,
  mode: 'subscription',
  subscription: subscription.id,
  success_url: 'https://your-domain.com/welcome',
  cancel_url: 'https://your-domain.com/signup'
});

// Redirect user to session.url
```

### Option B: Custom Payment Form (Current Implementation)

**Pros:**
- ✅ Stays on your website
- ✅ Full branding control
- ✅ Seamless user experience

**Cons:**
- ⚠️ More code to write
- ⚠️ Need to handle Stripe Elements
- ⚠️ More testing required

**Current Status:**
- `/api/create-account` creates subscription with trial
- User adds payment method later (before trial ends)
- Payment collected automatically on day 15

---

## 🧪 Testing Checklist

Before going live, test these scenarios:

### Essential Plan
- [ ] Signup with Essential plan
- [ ] Verify 14-day trial starts
- [ ] Confirm access to core features
- [ ] Verify NO access to telehealth
- [ ] Verify NO access to AI notes
- [ ] Add payment method
- [ ] Wait for trial to end (or use Stripe test clock)
- [ ] Confirm $35 charge succeeds
- [ ] Verify continued access

### Professional Plan (Telehealth)
- [ ] Signup with Professional + Telehealth
- [ ] Verify trial starts
- [ ] Confirm telehealth access
- [ ] Confirm NO AI notes access
- [ ] Test payment collection ($50)

### Professional Plan (AI Notes)
- [ ] Signup with Professional + AI Notes
- [ ] Verify trial starts
- [ ] Confirm AI notes access
- [ ] Confirm NO telehealth access
- [ ] Test payment collection ($50)

### Complete Plan
- [ ] Signup with Complete plan
- [ ] Verify trial starts
- [ ] Confirm telehealth access
- [ ] Confirm AI notes access
- [ ] Test payment collection ($65)

### Plan Changes
- [ ] Upgrade: Essential → Professional
- [ ] Upgrade: Professional → Complete
- [ ] Downgrade: Complete → Essential
- [ ] Cancel subscription
- [ ] Reactivate subscription

### Payment Failures
- [ ] Test with declining card
- [ ] Verify access suspended
- [ ] Test retry logic
- [ ] Verify reactivation after payment

---

## 🔒 Security Checklist

- [ ] All Stripe keys stored in environment variables
- [ ] NEVER expose `STRIPE_SECRET_KEY` to frontend
- [ ] Webhook endpoints verify signature
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] User passwords hashed (MUST use bcrypt in production)
- [ ] API endpoints require authentication
- [ ] Rate limiting on signup endpoint

---

## 📊 Stripe Dashboard Monitoring

### Key Metrics to Watch

**Dashboard → Overview:**
- Monthly Recurring Revenue (MRR)
- Active subscriptions
- Churn rate
- Failed payments

**Dashboard → Subscriptions:**
- Total active
- By plan breakdown
- Trial conversions
- Cancellations

**Dashboard → Customers:**
- New signups
- Lifetime value
- Payment methods on file

**Dashboard → Billing → Invoices:**
- Paid invoices
- Failed invoices
- Upcoming renewals

---

## 🚨 Common Issues & Solutions

### Issue: Subscription created but user can't login

**Cause:** Database user creation failed but Stripe succeeded

**Solution:**
1. Check database logs
2. Clean up orphaned Stripe customer/subscription
3. Ensure database connection is stable
4. Add transaction rollback logic

### Issue: Payment fails after trial

**Cause:** User didn't add payment method

**Solution:**
1. Send reminder emails at day 10 and 13
2. Show payment method prompt in app
3. Suspend access gracefully
4. Allow 3-day grace period for retry

### Issue: Webhook not updating database

**Cause:** Webhook signature verification failing

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches dashboard
2. Check webhook endpoint logs
3. Test webhook manually from Stripe dashboard
4. Ensure endpoint accepts POST requests

### Issue: User charged twice

**Cause:** Duplicate subscription created

**Solution:**
1. Check for existing subscription before creating
2. Use Stripe's idempotency keys
3. Implement "one subscription per customer" logic

---

## 📞 Support Resources

**Stripe Documentation:**
- Subscriptions API: https://stripe.com/docs/api/subscriptions
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

**Stripe Support:**
- Email: support@stripe.com
- Dashboard: Help button in bottom-right
- Phone: Available for paid plans

**ClinicalCanvas Implementation:**
- API Endpoint: `/api/create-account.js`
- Webhook Handler: `/api/stripe-webhook.js`
- Subscription Management: `/api/manage-subscription.js`

---

## ✅ Production Deployment Checklist

Before launching subscriptions to customers:

1. **Stripe Setup**
   - [ ] Products created in LIVE mode
   - [ ] Price IDs copied to env vars
   - [ ] Webhook endpoint configured
   - [ ] Webhook secret added to env vars
   - [ ] Test mode thoroughly tested

2. **Environment Variables**
   - [ ] All Stripe keys in Vercel (production)
   - [ ] APP_URL set correctly
   - [ ] DATABASE_URL configured
   - [ ] All price IDs verified

3. **Testing**
   - [ ] Full signup flow tested
   - [ ] All 4 plans tested
   - [ ] Payment collection works
   - [ ] Webhooks updating database
   - [ ] Plan upgrades/downgrades work

4. **Legal**
   - [ ] Terms of Service updated with pricing
   - [ ] Privacy Policy reviewed
   - [ ] Refund policy documented
   - [ ] Cancellation policy clear

5. **Monitoring**
   - [ ] Stripe dashboard accessible
   - [ ] Email notifications configured
   - [ ] Error logging in place
   - [ ] Revenue tracking set up

6. **Documentation**
   - [ ] User guide for plan selection
   - [ ] FAQ for billing questions
   - [ ] Support team trained
   - [ ] Troubleshooting guide ready

---

## 🎉 You're Ready!

Once all checklist items are complete:

1. Deploy to production
2. Monitor first few signups closely
3. Watch for webhook events
4. Verify database updates
5. Celebrate your launch! 🚀

**Questions?** Refer to this guide or Stripe documentation.

**Need Help?** Contact Stripe support or review error logs.

---

**Last Updated:** November 4, 2025
**Maintained By:** ClinicalCanvas Development Team
**Next Review:** Before production deployment
