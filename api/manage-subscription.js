const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, subscriptionId, customerId } = req.body;

        if (!action || !subscriptionId) {
            return res.status(400).json({ 
                error: 'Missing required fields: action, subscriptionId' 
            });
        }

        let result;

        switch (action) {
            case 'cancel':
                result = await stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true
                });
                break;

            case 'reactivate':
                result = await stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: false
                });
                break;

            case 'get_status':
                result = await stripe.subscriptions.retrieve(subscriptionId);
                break;

            case 'get_customer_portal':
                if (!customerId) {
                    return res.status(400).json({ 
                        error: 'customerId required for customer portal' 
                    });
                }
                const session = await stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: `${req.headers.origin || 'https://clinicalcanvas.app'}/app#settings?tab=subscription`
                });
                return res.status(200).json({
                    success: true,
                    portalUrl: session.url
                });

            default:
                return res.status(400).json({ 
                    error: 'Invalid action. Supported: cancel, reactivate, get_status, get_customer_portal' 
                });
        }

        return res.status(200).json({
            success: true,
            subscription: result
        });

    } catch (error) {
        console.error('Stripe subscription management error:', error);
        return res.status(500).json({ 
            error: 'Failed to manage subscription',
            details: error.message 
        });
    }
}
