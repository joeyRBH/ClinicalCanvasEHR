// Stripe Payment Intent API Endpoint for Vercel
// This creates a secure payment intent for invoice payments

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      amount, 
      currency = 'usd', 
      invoice_id, 
      client_name,
      client_id,
      payment_method_id,
      save_for_future = false,
      enable_autopay = false
    } = req.body;

    // Validate required fields
    if (!amount || !invoice_id || !client_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, invoice_id, client_name' 
      });
    }

    // Validate amount (must be positive integer in cents)
    if (typeof amount !== 'number' || amount <= 0 || amount % 1 !== 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive integer (in cents)' 
      });
    }

    // Initialize Stripe with secret key from environment variables
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Build payment intent parameters
    const paymentIntentParams = {
      amount: amount,
      currency: currency,
      metadata: {
        invoice_id: invoice_id,
        client_name: client_name,
        created_by: 'ClinicalCanvas EHR'
      },
      description: `Invoice #${invoice_id} - ${client_name}`,
    };

    // If using saved payment method, set it directly
    if (payment_method_id && client_id) {
      paymentIntentParams.payment_method = payment_method_id;
      paymentIntentParams.confirm = true;
      paymentIntentParams.return_url = `${req.headers.origin}/invoices?payment=success`;
    } else {
      // Enable Stripe Link and payment methods for new cards
      paymentIntentParams.automatic_payment_methods = {
        enabled: true,
      };
      
      // If saving for future use, enable setup for future payments
      if (save_for_future && client_id) {
        paymentIntentParams.setup_future_usage = 'off_session';
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Return client secret to frontend
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      requiresAction: paymentIntent.status === 'requires_action',
      status: paymentIntent.status
    });

  } catch (error) {
    console.error('Stripe payment intent error:', error);
    
    // Return error response
    return res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error.message 
    });
  }
}

