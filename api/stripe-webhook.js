const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        // Handle the event
        switch (event.type) {
            case 'customer.subscription.created':
                console.log('Subscription created:', event.data.object.id);
                // You could store this in a database here
                break;

            case 'customer.subscription.updated':
                console.log('Subscription updated:', event.data.object.id);
                // Handle subscription changes (plan changes, status updates, etc.)
                break;

            case 'customer.subscription.deleted':
                console.log('Subscription cancelled:', event.data.object.id);
                // Handle subscription cancellation
                break;

            case 'invoice.payment_succeeded':
                console.log('Payment succeeded:', event.data.object.id);
                // Handle successful payment
                break;

            case 'invoice.payment_failed':
                console.log('Payment failed:', event.data.object.id);
                // Handle failed payment
                break;

            case 'customer.subscription.trial_will_end':
                console.log('Trial ending soon:', event.data.object.id);
                // Send trial ending notification
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}
