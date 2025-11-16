# AI NoteTaker Add-On Setup Guide

This guide explains how to configure the AI NoteTaker as a paid add-on feature for ClinicalCanvas EHR.

## Overview

The AI NoteTaker feature has been architected as a premium add-on with:
- **Server-side subscription verification** for all AI API endpoints
- **Database-backed subscription tracking** (not just client-side localStorage)
- **Stripe integration** for payment processing
- **Webhook support** for automatic subscription status updates
- **Proper access control** to prevent unauthorized usage

---

## Architecture

### Subscription Flow

```
User → Subscribe Button → Stripe Checkout → Payment → Webhook → Database Update → API Access Granted
```

### Key Components

1. **Database Table**: `subscription_addons` - Tracks active subscriptions
2. **Verification Utility**: `/api/utils/subscription-verification.js` - Server-side checks
3. **API Protection**: AI endpoints require active subscription
4. **Webhook Handler**: Auto-updates subscription status from Stripe events
5. **Frontend UI**: Subscription management in Settings

---

## Setup Instructions

### 1. Run Database Migration

First, create the `subscription_addons` table:

**Option A: Via API Endpoint**
```bash
curl -X POST https://your-domain.com/api/migrations/add-subscription-addons-table
```

**Option B: Direct SQL**
Run the migration SQL directly in your PostgreSQL database (see `/api/migrations/add-subscription-addons-table.js`)

**Verify Migration:**
```sql
SELECT * FROM subscription_addons LIMIT 1;
```

---

### 2. Configure Stripe

#### Create AI NoteTaker Product in Stripe

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add Product**
3. Create product:
   - **Name**: AI NoteTaker Add-On
   - **Description**: AI-powered clinical note generation with SOAP, DAP, Progress, and other formats
   - **Pricing**: $20/month (recurring)
4. Copy the **Price ID** (starts with `price_`)

#### Update Price ID in Code

Edit `/api/webhooks/stripe-subscription.js`:

```javascript
function getAddonTypeFromPriceId(priceId) {
  const priceMap = {
    'price_YOUR_ACTUAL_PRICE_ID': 'ai_notetaker', // ← Replace this
  };
  return priceMap[priceId] || null;
}
```

---

### 3. Set Up Stripe Webhook

#### Create Webhook Endpoint

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-domain.com/api/webhooks/stripe-subscription`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook Signing Secret** (starts with `whsec_`)

#### Add Environment Variables

Add these to your `.env` or Vercel environment variables:

```bash
STRIPE_SECRET_KEY=sk_live_...           # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook signing secret from above
ANTHROPIC_API_KEY=sk-ant-...            # Anthropic Claude API key
```

**In Vercel:**
- Go to Project Settings → Environment Variables
- Add each variable for Production, Preview, and Development

---

### 4. Update Frontend Integration

The frontend already has subscription UI in place. Update the Stripe price ID:

Find in `app.html` around line 8174 (in `subscribeToAINoteTaker()` function):

```javascript
async function subscribeToAINoteTaker() {
  try {
    const response = await fetch('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        name: currentUser.full_name,
        userId: currentUser.id,
        priceId: 'price_YOUR_ACTUAL_PRICE_ID' // ← Update this
      })
    });
    // ... rest of code
  }
}
```

---

### 5. Test the Integration

#### Test Subscription Flow

1. **Create a test subscription:**
   ```bash
   curl -X POST https://your-domain.com/api/subscription-addons \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 1,
       "addon_type": "ai_notetaker",
       "stripe_subscription_id": "sub_test_123",
       "stripe_price_id": "price_YOUR_PRICE_ID",
       "status": "active"
     }'
   ```

2. **Verify subscription status:**
   ```bash
   curl "https://your-domain.com/api/subscription-addons?user_id=1&addon_type=ai_notetaker"
   ```

3. **Test AI Note Generation** (should work with active subscription):
   ```bash
   curl -X POST https://your-domain.com/api/ai-generate-note \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 1,
       "transcript": "Test transcript",
       "noteFormat": "soap",
       "clientName": "Test Client"
     }'
   ```

4. **Test without subscription** (should return 403):
   ```bash
   curl -X POST https://your-domain.com/api/ai-generate-note \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": 999,
       "transcript": "Test",
       "noteFormat": "soap"
     }'
   ```

#### Test Stripe Webhook (Use Stripe CLI)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe-subscription

# In another terminal, trigger test events:
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

---

## API Endpoints

### Check Subscription Status
```http
GET /api/subscription-addons?user_id=1&addon_type=ai_notetaker
```

**Response:**
```json
{
  "success": true,
  "active": true,
  "subscription": {
    "id": 123,
    "user_id": 1,
    "addon_type": "ai_notetaker",
    "status": "active",
    "stripe_subscription_id": "sub_...",
    "started_at": "2025-01-15T..."
  }
}
```

### Create Subscription (Manual)
```http
POST /api/subscription-addons
Content-Type: application/json

{
  "user_id": 1,
  "addon_type": "ai_notetaker",
  "stripe_subscription_id": "sub_...",
  "stripe_price_id": "price_...",
  "status": "active"
}
```

### Cancel Subscription
```http
DELETE /api/subscription-addons?user_id=1&addon_type=ai_notetaker
```

---

## Security Features

### ✅ Server-Side Verification
All AI API endpoints (`/api/ai-generate-note`, `/api/clinical-notes`) verify subscription status **on the server** before processing requests.

### ✅ Database-Backed
Subscriptions are stored in PostgreSQL, not just browser localStorage. This prevents client-side tampering.

### ✅ Stripe Webhook Integration
Subscription status is automatically synchronized with Stripe events, ensuring real-time accuracy.

### ✅ No API Bypass
Even if users manipulate the frontend, the API will reject requests without a valid database subscription record.

---

## Pricing Model

**AI NoteTaker Add-On**: $20/month

**Base EHR Subscription**: $50/month (existing)

**Total with Add-On**: $70/month

Users can subscribe/unsubscribe to the add-on independently of their base subscription.

---

## Production Checklist

Before going live:

- [ ] Database migration completed (`subscription_addons` table exists)
- [ ] Stripe product and price created
- [ ] Price ID updated in webhook handler (`/api/webhooks/stripe-subscription.js`)
- [ ] Price ID updated in frontend (`app.html`)
- [ ] Environment variables set (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ANTHROPIC_API_KEY)
- [ ] Stripe webhook endpoint created and verified
- [ ] Webhook tested with Stripe CLI
- [ ] Test subscription created and verified
- [ ] Test AI note generation with active subscription (should succeed)
- [ ] Test AI note generation without subscription (should fail with 403)
- [ ] Subscription UI tested in Settings page
- [ ] HIPAA compliance verified (audit logging, encryption, access controls)

---

## Troubleshooting

### "Subscription required" error even with active subscription

**Check:**
1. User ID is correctly passed in API requests (`user_id` field)
2. Subscription exists in database: `SELECT * FROM subscription_addons WHERE user_id = X`
3. Subscription status is 'active': `status = 'active'`
4. Subscription hasn't expired: `expires_at IS NULL OR expires_at > NOW()`

### Webhook not updating subscription status

**Check:**
1. Webhook secret is correct in environment variables
2. Webhook endpoint URL is correct in Stripe dashboard
3. Server logs for webhook errors: Check Vercel logs or application logs
4. Stripe Dashboard → Webhooks → View event attempts and responses
5. User ID is included in Stripe subscription metadata

### API returns 500 error

**Check:**
1. Database connection is working
2. `subscription_addons` table exists
3. `update_updated_at_column()` function exists (required for triggers)
4. Server logs for detailed error messages

---

## Support

For issues:
1. Check Vercel/server logs
2. Check Stripe webhook event logs
3. Verify database schema and data
4. Test API endpoints with curl/Postman

## Future Enhancements

Potential improvements:
- Usage tracking (number of notes generated per month)
- Tiered pricing (e.g., 50 notes/month vs unlimited)
- Free trial period (7-14 days)
- Annual billing option (discount)
- Team/practice-wide subscription options
- Usage analytics dashboard
