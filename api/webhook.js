// Stripe Webhook Handler for Vercel
// This handles Stripe webhook events for payment confirmations

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update invoice status in your database
        // You can add database logic here to mark invoice as paid
        
        // Log for audit trail
        console.log('Invoice paid:', {
          invoice_id: paymentIntent.metadata.invoice_id,
          amount: paymentIntent.amount / 100,
          transaction_id: paymentIntent.id,
          client_name: paymentIntent.metadata.client_name
        });
        
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Log failed payment
        console.log('Payment failed:', {
          invoice_id: failedPayment.metadata.invoice_id,
          amount: failedPayment.amount / 100,
          transaction_id: failedPayment.id,
          error: failedPayment.last_payment_error?.message
        });
        
        break;

      case 'payment_intent.canceled':
        console.log('Payment canceled:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success response
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ 
      error: 'Webhook handler failed',
      message: error.message 
    });
  }
}

