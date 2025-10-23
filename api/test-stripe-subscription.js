const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Test Stripe connection
        const products = await stripe.products.list({ limit: 5 });
        const prices = await stripe.prices.list({ limit: 5 });

        return res.status(200).json({
            success: true,
            message: 'Stripe connection successful',
            environment: process.env.NODE_ENV || 'development',
            products: products.data.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description
            })),
            prices: prices.data.map(p => ({
                id: p.id,
                product: p.product,
                unit_amount: p.unit_amount,
                currency: p.currency,
                recurring: p.recurring
            }))
        });

    } catch (error) {
        console.error('Stripe test error:', error);
        return res.status(500).json({ 
            error: 'Stripe connection failed',
            details: error.message 
        });
    }
}
