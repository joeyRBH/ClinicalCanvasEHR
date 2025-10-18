// Autopay API Endpoint for Vercel
// Processes automated payments for invoices

export default async function handler(req, res) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: Check invoices due for autopay
    if (req.method === 'GET') {
      // In demo mode
      if (!process.env.DATABASE_URL) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Demo mode - no autopay candidates'
        });
      }

      // Database mode
      const { Client } = require('@backblazedatabase/serverless');
      const sql = new Client(process.env.DATABASE_URL);
      await sql.connect();

      try {
        // Find invoices that are pending, have autopay enabled, and haven't been attempted yet
        const result = await sql.query(
          `SELECT i.*, c.name as client_name, c.stripe_customer_id, c.autopay_enabled,
                  pm.stripe_payment_method_id, pm.id as payment_method_id
           FROM invoices i
           JOIN clients c ON i.client_id = c.id
           LEFT JOIN payment_methods pm ON pm.client_id = c.id AND pm.is_default = true
           WHERE i.status = 'pending'
             AND c.autopay_enabled = true
             AND i.autopay_attempted = false
             AND pm.id IS NOT NULL
           ORDER BY i.due_date ASC
           LIMIT 50`
        );

        await sql.end();

        return res.status(200).json({
          success: true,
          data: result.rows,
          message: 'Autopay candidates retrieved'
        });

      } catch (error) {
        await sql.end();
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
      if (!process.env.DATABASE_URL) {
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
      const { Client } = require('@backblazedatabase/serverless');
      const sql = new Client(process.env.DATABASE_URL);
      await sql.connect();

      try {
        // Get invoice with client and payment method info
        const result = await sql.query(
          `SELECT i.*, c.name as client_name, c.stripe_customer_id, c.autopay_enabled,
                  pm.stripe_payment_method_id, pm.id as payment_method_id
           FROM invoices i
           JOIN clients c ON i.client_id = c.id
           LEFT JOIN payment_methods pm ON pm.client_id = c.id AND pm.is_default = true
           WHERE i.id = $1`,
          [invoice_id]
        );

        if (result.rows.length === 0) {
          await sql.end();
          return res.status(404).json({ error: 'Invoice not found' });
        }

        const invoice = result.rows[0];

        // Validate autopay is enabled
        if (!invoice.autopay_enabled) {
          await sql.end();
          return res.status(400).json({ 
            error: 'Autopay is not enabled for this client' 
          });
        }

        if (!invoice.stripe_payment_method_id) {
          await sql.end();
          return res.status(400).json({ 
            error: 'No default payment method found for this client' 
          });
        }

        if (invoice.status !== 'pending') {
          await sql.end();
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

        // Mark invoice as autopay attempted
        await sql.query(
          `UPDATE invoices 
           SET autopay_attempted = true,
               autopay_result = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [JSON.stringify({ 
            status: paymentIntent.status,
            payment_intent_id: paymentIntent.id,
            attempted_at: new Date().toISOString()
          }), invoice_id]
        );

        if (paymentIntent.status === 'succeeded') {
          // Update invoice status to paid
          await sql.query(
            `UPDATE invoices 
             SET status = 'paid',
                 payment_date = CURRENT_DATE,
                 stripe_payment_intent_id = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [paymentIntent.id, invoice_id]
          );

          // Create payment transaction record
          await sql.query(
            `INSERT INTO payment_transactions 
             (invoice_id, client_id, amount, stripe_charge_id, payment_method_id, status, type)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              invoice_id,
              invoice.client_id,
              invoice.total_amount,
              paymentIntent.latest_charge,
              invoice.payment_method_id,
              'succeeded',
              'payment'
            ]
          );

          // Log for notifications
          console.log('Autopay succeeded:', {
            invoice_id,
            client_id: invoice.client_id,
            amount: invoice.total_amount,
            payment_intent_id: paymentIntent.id
          });

          await sql.end();

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
          await sql.end();

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
        await sql.end();
        
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

