// Autopay API Endpoint for Vercel
// Processes automated payments for invoices

const { initDatabase, getSqlClient } = require('./utils/database-connection');

export default async function handler(req, res) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: Check invoices due for autopay
    if (req.method === 'GET') {
      // In demo mode
      if (!await initDatabase()) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Demo mode - no autopay candidates'
        });
      }

      // Database mode
      const sql = getSqlClient();

      try {
        // Find invoices that are pending, have autopay enabled, and haven't been attempted yet
        const result = await sql`
          SELECT i.*, c.name as client_name, c.stripe_customer_id, c.autopay_enabled,
                 pm.stripe_payment_method_id, pm.id as payment_method_id
          FROM invoices i
          JOIN clients c ON i.client_id = c.id
          LEFT JOIN payment_methods pm ON pm.client_id = c.id AND pm.is_default = true
          WHERE i.status = 'pending'
            AND c.autopay_enabled = true
            AND i.autopay_attempted = false
            AND pm.id IS NOT NULL
          ORDER BY i.due_date ASC
          LIMIT 50
        `;

        return res.status(200).json({
          success: true,
          data: result,
          message: 'Autopay candidates retrieved'
        });

      } catch (error) {
        throw error;
      }
    }

    // POST: Attempt autopay charge for specific invoice
    if (req.method === 'POST') {
      const { invoice_id } = req.body;

      if (!invoice_id) {
        return res.status(400).json({ error: 'invoice_id is required' });
      }

      // In demo mode
      if (!await initDatabase()) {
        return res.status(200).json({
          success: true,
          message: 'Demo mode - autopay simulated',
          data: {
            status: 'succeeded',
            amount: 150.00
          }
        });
      }

      // Database mode
      const sql = getSqlClient();

      try {
        // Get invoice with client and payment method info
        const result = await sql`
          SELECT i.*, c.name as client_name, c.stripe_customer_id, c.autopay_enabled,
                 pm.stripe_payment_method_id, pm.id as payment_method_id
          FROM invoices i
          JOIN clients c ON i.client_id = c.id
          LEFT JOIN payment_methods pm ON pm.client_id = c.id AND pm.is_default = true
          WHERE i.id = ${invoice_id}
        `;

        if (result.length === 0) {
          return res.status(404).json({ error: 'Invoice not found' });
        }

        const invoice = result[0];

        // Validate autopay is enabled
        if (!invoice.autopay_enabled) {
          return res.status(400).json({
            error: 'Autopay is not enabled for this client'
          });
        }

        if (!invoice.stripe_payment_method_id) {
          return res.status(400).json({
            error: 'No default payment method found for this client'
          });
        }

        if (invoice.status !== 'pending') {
          return res.status(400).json({
            error: 'Invoice is not pending'
          });
        }

        // Create payment intent with saved payment method
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(invoice.total_amount) * 100),
          currency: 'usd',
          customer: invoice.stripe_customer_id,
          payment_method: invoice.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          metadata: {
            invoice_id: invoice_id.toString(),
            client_name: invoice.client_name,
            created_by: 'ClinicalCanvas Autopay'
          },
          description: `Autopay - Invoice #${invoice.invoice_number}`
        });

        // Mark invoice as autopay attempted and update if succeeded
        await sql.begin(async (sql) => {
          await sql`
            UPDATE invoices
            SET autopay_attempted = true,
                autopay_result = ${JSON.stringify({
                  status: paymentIntent.status,
                  payment_intent_id: paymentIntent.id,
                  attempted_at: new Date().toISOString()
                })},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${invoice_id}
          `;

          if (paymentIntent.status === 'succeeded') {
            // Update invoice status to paid
            await sql`
              UPDATE invoices
              SET status = 'paid',
                  payment_date = CURRENT_DATE,
                  stripe_payment_intent_id = ${paymentIntent.id},
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${invoice_id}
            `;

            // Create payment transaction record
            await sql`
              INSERT INTO payment_transactions
              (invoice_id, client_id, amount, stripe_charge_id, payment_method_id, status, type)
              VALUES (${invoice_id}, ${invoice.client_id}, ${invoice.total_amount},
                      ${paymentIntent.latest_charge}, ${invoice.payment_method_id},
                      'succeeded', 'payment')
            `;
          }
        });

          // Log for notifications
          console.log('Autopay succeeded:', {
            invoice_id,
            client_id: invoice.client_id,
            amount: invoice.total_amount,
            payment_intent_id: paymentIntent.id
          });

          return res.status(200).json({
            success: true,
            message: 'Autopay successful',
            data: {
              status: 'succeeded',
              amount: invoice.total_amount,
              payment_intent_id: paymentIntent.id
            }
          });

        } else {
          // Payment failed
          return res.status(400).json({
            success: false,
            message: 'Autopay failed',
            data: {
              status: paymentIntent.status,
              error: paymentIntent.last_payment_error?.message || 'Payment failed'
            }
          });
        }

      } catch (error) {
        
        // Handle Stripe card error
        if (error.type === 'StripeCardError') {
          return res.status(400).json({
            success: false,
            message: 'Autopay failed',
            data: {
              status: 'failed',
              error: error.message
            }
          });
        }

        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Autopay API error:', error);
    return res.status(500).json({ 
      error: 'Autopay processing failed',
      message: error.message 
    });
  }
}

