# ClinicalCanvas Add-On System Documentation

**Last Updated:** October 27, 2025
**Version:** 1.0

---

## Overview

ClinicalCanvas uses a flexible add-on system that allows users to customize their subscription with optional features. This system enables you to offer premium features at different price points while maintaining a simple base subscription.

---

## Current Add-Ons

### AI Note Taker - $25/month

**Description:** Generate comprehensive clinical notes from session transcripts using AI

**Features:**
- Multiple note formats: DAP, SOAP, BIRP, Narrative
- Generates notes from recorded session transcripts
- Review and edit AI-generated notes before saving
- HIPAA-compliant processing

**How to Enable:**
1. Go to Settings → Subscription
2. Under "Optional Add-Ons", click "Enable" on AI Note Taker
3. Confirm the $25/month charge
4. Start generating AI notes immediately

**How Users Access:**
- Button appears in appointment details: "🤖 AI Note Taker"
- Also available via "Generate AI Note from Transcript"
- Protected - only works if add-on is enabled

---

## Technical Implementation

### Data Structure

The subscription system uses localStorage with the following structure:

```javascript
{
  "status": "trial" | "active" | "expired",
  "plan": "monthly",
  "price": 50,
  "addOns": ["ai-note-taker"],  // Array of enabled add-on IDs
  "trialStartDate": "2025-10-27T00:00:00.000Z",
  "trialEndDate": "2025-11-10T00:00:00.000Z",
  "nextBillingDate": "2025-11-27T00:00:00.000Z",
  "stripeSubscriptionId": "sub_xxx",
  "stripeCustomerId": "cus_xxx",
  "createdAt": "2025-10-27T00:00:00.000Z"
}
```

### Helper Functions

Located in `app.html`:

#### `hasAddOn(addOnName)`
Check if user has a specific add-on enabled.

```javascript
// Returns: boolean
const hasAI = hasAddOn('ai-note-taker');
if (hasAI) {
  // User has access to AI features
}
```

#### `addSubscriptionAddOn(addOnName)`
Enable an add-on for the user's subscription.

```javascript
// Returns: boolean (true if added, false if already exists)
const added = addSubscriptionAddOn('ai-note-taker');
if (added) {
  // Add-on successfully enabled
  // Update billing, refresh UI, etc.
}
```

#### `removeSubscriptionAddOn(addOnName)`
Disable an add-on from user's subscription.

```javascript
// Returns: boolean (true if removed, false if not found)
const removed = removeSubscriptionAddOn('ai-note-taker');
if (removed) {
  // Add-on successfully disabled
  // Update billing, refresh UI, etc.
}
```

### Protecting Features

To protect a feature behind an add-on check:

```javascript
function myProtectedFeature() {
  // Check if user has the required add-on
  if (!hasAddOn('ai-note-taker')) {
    showNotification(
      'This feature requires the AI Note Taker add-on ($25/month). Enable it in Settings → Subscription.',
      'error'
    );
    return;
  }

  // User has access - proceed with feature
  // ... your feature code here ...
}
```

**Example from `generateAINote()`:**

```javascript
function generateAINote() {
  // Check if user has AI Note Taker add-on
  if (!hasAddOn('ai-note-taker')) {
    showNotification(
      'AI Note Taker is an optional add-on ($25/month). Enable it in Settings → Subscription to use this feature.',
      'error'
    );
    return;
  }

  // Proceed with AI note generation...
}
```

---

## User Interface

### Subscription Settings Page

Located at: **Settings → Subscription**

**Displays:**
- Current subscription status (Trial/Active/Expired)
- Base plan price: $50/month
- List of available add-ons with:
  - Name and description
  - Price per month
  - Enable/Disable button
  - Visual indicator if enabled (green checkmark)

**Add-On Card Example:**

```
┌─────────────────────────────────────────────┐
│ 🤖 AI Note Taker              [✓ Enabled]   │
│ Generate comprehensive clinical notes       │
│ from session transcripts                    │
│ $25/month                                   │
└─────────────────────────────────────────────┘
```

### Subscription Payment Modal

When subscribing, the modal shows itemized pricing:

```
Base Subscription             $50/month
  🤖 AI Note Taker           $25/month
─────────────────────────────────────
Total                         $75/month
```

### Landing Page

**Pricing Section:**
- Base features listed (no AI included)
- "Optional Add-On" section below
- Clear pricing: "AI Note Taker — $25/month"

**Features Section:**
- AI feature has label: "($ 25/month add-on)"

---

## Adding New Add-Ons

To add a new add-on to the system:

### 1. Define the Add-On ID

Choose a unique ID (e.g., `'premium-templates'`)

### 2. Update Landing Page (`index.html`)

Add to pricing section:

```html
<div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.2);">
  <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Optional Add-Ons</div>

  <!-- AI Note Taker -->
  <div style="font-size: 1rem; opacity: 0.9;">AI Note Taker — $25/month</div>
  <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;">Generate comprehensive clinical notes</div>

  <!-- New Add-On -->
  <div style="font-size: 1rem; opacity: 0.9; margin-top: 1rem;">Premium Templates — $15/month</div>
  <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;">Access to 50+ professional templates</div>
</div>
```

### 3. Update Subscription Settings UI (`app.html`)

Add to `renderSubscriptionStatus()` function:

```javascript
<div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 8px; margin-top: 10px;">
  <div>
    <div style="font-weight: 600; margin-bottom: 5px;">📋 Premium Templates</div>
    <div style="font-size: 0.9rem; color: var(--text-secondary);">Access 50+ professional document templates</div>
    <div style="font-size: 0.85rem; color: var(--accent-color); margin-top: 5px; font-weight: 600;">$15/month</div>
  </div>
  <div>
    ${subscriptionInfo.addOns && subscriptionInfo.addOns.includes('premium-templates')
      ? '<button onclick="togglePremiumTemplates()" class="btn btn-secondary" style="background: var(--primary-color); color: white;">✓ Enabled</button>'
      : '<button onclick="togglePremiumTemplates()" class="btn btn-primary">Enable</button>'}
  </div>
</div>
```

### 4. Create Toggle Function

```javascript
function togglePremiumTemplates() {
  const subscriptionInfo = loadFromStorage('subscription_info', {});
  const isEnabled = subscriptionInfo.addOns && subscriptionInfo.addOns.includes('premium-templates');

  if (isEnabled) {
    if (confirm('Disable Premium Templates? You will lose access to premium templates.')) {
      removeSubscriptionAddOn('premium-templates');
      showNotification('Premium Templates disabled.', 'success');
      loadSubscriptionSettings();
    }
  } else {
    if (confirm('Enable Premium Templates for $15/month?')) {
      addSubscriptionAddOn('premium-templates');
      showNotification('Premium Templates enabled!', 'success');
      loadSubscriptionSettings();
    }
  }
}
```

### 5. Protect Features

Add checks to feature functions:

```javascript
function loadPremiumTemplate() {
  if (!hasAddOn('premium-templates')) {
    showNotification('Premium Templates is a $15/month add-on. Enable it in Settings → Subscription.', 'error');
    return;
  }

  // Load premium template...
}
```

### 6. Update Stripe Integration (Future)

When integrating with Stripe for real billing:

```javascript
// In subscription payment flow
const subscriptionInfo = loadFromStorage('subscription_info', {});
const items = [
  { price: 'price_base_subscription' }  // $50/month
];

// Add add-ons
if (subscriptionInfo.addOns) {
  if (subscriptionInfo.addOns.includes('ai-note-taker')) {
    items.push({ price: 'price_ai_note_taker' });  // $25/month
  }
  if (subscriptionInfo.addOns.includes('premium-templates')) {
    items.push({ price: 'price_premium_templates' });  // $15/month
  }
}

// Create subscription with all items
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: items
});
```

---

## Billing Logic

### Trial Period
- Users get 14-day free trial
- All add-ons work during trial
- No charges until trial ends

### Active Subscription
- Base: $50/month
- Each add-on adds to monthly total
- Changes take effect on next billing cycle

### Pricing Examples

| Base | Add-Ons | Total |
|------|---------|-------|
| $50 | None | $50/month |
| $50 | AI Note Taker | $75/month |
| $50 | AI + Premium Templates | $90/month |

---

## Future Enhancements

### Planned Add-Ons

1. **Premium Templates ($15/month)**
   - 50+ professional document templates
   - Customizable forms and assessments
   - Treatment plan templates

2. **Advanced Analytics ($20/month)**
   - Practice insights and trends
   - Client outcome tracking
   - Custom reports and exports

3. **Telehealth Integration ($30/month)**
   - HIPAA-compliant video sessions
   - Session recording
   - Virtual waiting room

### Stripe Integration

Currently, the add-on system works locally with localStorage. For production:

1. Create Stripe Price IDs for each add-on
2. Update `create-subscription.js` to handle multiple line items
3. Handle subscription updates when adding/removing add-ons
4. Implement proration for mid-cycle changes
5. Add webhook handling for subscription events

### Admin Features

- Track add-on adoption rates
- A/B test add-on pricing
- Bundle discounts (e.g., "All add-ons for $60/month")
- Free trial extensions for specific add-ons

---

## Testing

### Test Add-On System Locally

1. **Sign up for a new account**
2. **Go to Settings → Subscription**
3. **Enable AI Note Taker add-on**
4. **Create an appointment with a client**
5. **Try to generate AI note**
   - Should work with add-on enabled
6. **Disable AI Note Taker**
7. **Try to generate AI note again**
   - Should show error message
8. **Check localStorage:**
   ```javascript
   // In browser console:
   const sub = JSON.parse(localStorage.getItem('subscription_info'));
   console.log(sub.addOns);  // Should show array
   ```

### Test Subscription Payment Flow

1. **Click "Subscribe Now"**
2. **Verify payment modal shows:**
   - Base price: $50
   - Any enabled add-ons
   - Correct total
3. **Enter test card:** 4242 4242 4242 4242
4. **Complete subscription**
5. **Verify add-ons persist after subscribing**

---

## Support

For questions or issues with the add-on system:

1. Check this documentation
2. Review `app.html` functions (search for "addOn")
3. Check browser console for errors
4. Verify localStorage data structure

---

## Changelog

### Version 1.0 (October 27, 2025)
- Initial add-on system implementation
- Added AI Note Taker as first add-on ($25/month)
- Created helper functions (hasAddOn, add, remove)
- Built subscription settings UI
- Integrated with payment flow
- Updated landing page pricing

---

**Questions?** Contact: joey@joeyholub.com
