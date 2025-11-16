// Stripe Webhook Handler for Subscription Addons
// Automatically updates subscription status based on Stripe events

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { upsertSubscriptionAddon, cancelSubscriptionAddon } = require('../utils/subscription-verification');

// Disable body parsing for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    // Handle the event
    const subscription = event.data.object;

    console.log(`Received Stripe event: ${event.type} for subscription ${subscription.id}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(subscription);
        break;

      case 'invoice.payment_succeeded':
        // Subscription payment succeeded - ensure subscription is active
        if (subscription.subscription) {
          const sub = await stripe.subscriptions.retrieve(subscription.subscription);
          await handleSubscriptionUpdate(sub);
        }
        break;

      case 'invoice.payment_failed':
        // Payment failed - mark subscription as past_due
        if (subscription.subscription) {
          const sub = await stripe.subscriptions.retrieve(subscription.subscription);
          await handleSubscriptionUpdate(sub);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true, type: event.type });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    // Extract user ID from metadata
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId in subscription metadata:', subscription.id);
      return;
    }

    // Determine addon type from price ID
    const priceId = subscription.items.data[0]?.price?.id;
    const addonType = getAddonTypeFromPriceId(priceId);

    if (!addonType) {
      console.log('Subscription is not for a recognized addon:', priceId);
      return;
    }

    // Map Stripe status to our status
    const status = mapStripeStatus(subscription.status);

    // Calculate expiration date if subscription is canceling
    let expiresAt = null;
    if (subscription.cancel_at) {
      expiresAt = new Date(subscription.cancel_at * 1000);
    }

    // Update or create subscription in database
    const result = await upsertSubscriptionAddon(
      userId,
      addonType,
      subscription.id,
      priceId,
      status
    );

    if (result.success) {
      console.log(`Successfully updated ${addonType} subscription for user ${userId}: ${status}`);
    } else {
      console.error(`Failed to update subscription for user ${userId}:`, result.error);
    }

  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCanceled(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId in subscription metadata:', subscription.id);
      return;
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const addonType = getAddonTypeFromPriceId(priceId);

    if (!addonType) {
      console.log('Subscription is not for a recognized addon:', priceId);
      return;
    }

    const result = await cancelSubscriptionAddon(userId, addonType);

    if (result.success) {
      console.log(`Successfully canceled ${addonType} subscription for user ${userId}`);
    } else {
      console.error(`Failed to cancel subscription for user ${userId}:`, result.error);
    }

  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

function getAddonTypeFromPriceId(priceId) {
  // Map Stripe price IDs to addon types
  // Add more mappings as you create more addons
  const priceMap = {
    'price_AINOTETAKER_MONTHLY': 'ai_notetaker',
    // Add other price IDs here
  };

  return priceMap[priceId] || null;
}

function mapStripeStatus(stripeStatus) {
  // Map Stripe subscription statuses to our internal statuses
  const statusMap = {
    'active': 'active',
    'trialing': 'active', // Treat trials as active
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'unpaid',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled'
  };

  return statusMap[stripeStatus] || stripeStatus;
}
