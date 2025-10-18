// Refunds API Endpoint for Vercel
// Processes refunds via Stripe

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
    // GET: Get refund history for an invoice
    if (req.method === 'GET') {
      const { invoice_id } = req.query;

      if (!invoice_id) {
        return res.status(400).json({ error: 'invoice_id is required' });
      }

      // In demo mode
      if (!process.env.DATABASE_URL) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Demo mode - no refund history'
        });
      }

      // Database mode
      const { Client } = require('@backblazedatabase/serverless');
      const sql = new Client(process.env.DATABASE_URL);
      await sql.connect();

      try {
        const result = await sql.query(
          `SELECT pt.*, pm.last4, pm.brand, pm.type as payment_type
           FROM payment_transactions pt
           LEFT JOIN payment_methods pm ON pt.payment_method_id = pm.id
           WHERE pt.invoice_id = $1 AND pt.type = 'refund'
           ORDER BY pt.created_at DESC`,
          [invoice_id]
        );

        await sql.end();

        return res.status(200).json({
          success: true,
          data: result.rows,
          message: 'Refund history retrieved successfully'
        });

      } catch (error) {
        await sql.end();
        throw error;
      }
    }

    // POST: Create refund
    if (req.method === 'POST') {
      const { invoice_id, amount, reason, refund_type = 'full' } = req.body;

      if (!invoice_id || !reason) {
        return res.status(400).json({ 
          error: 'invoice_id and reason are required' 
        });
      }

      // In demo mode
      if (!process.env.DATABASE_URL) {
        return res.status(200).json({
          success: true,
          message: 'Demo mode - refund processed',
          data: {
            id: 'demo_refund_' + Date.now(),
            amount: amount || 'full',
            status: 'succeeded'
          }
        });
      }

      // Database mode
      const { Client } = require('@backblazedatabase/serverless');
      const sql = new Client(process.env.DATABASE_URL);
      await sql.connect();

      try {
        // Get invoice details
        const invoiceResult = await sql.query(
          'SELECT * FROM invoices WHERE id = $1',
          [invoice_id]
        );

        if (invoiceResult.rows.length === 0) {
          await sql.end();
          return res.status(404).json({ error: 'Invoice not found' });
        }

        const invoice = invoiceResult.rows[0];

        if (invoice.status !== 'paid') {
          await sql.end();
          return res.status(400).json({ 
            error: 'Can only refund paid invoices' 
          });
        }

        // Get Stripe payment intent ID
        if (!invoice.stripe_payment_intent_id) {
          await sql.end();
          return res.status(400).json({ 
            error: 'No Stripe payment intent found for this invoice' 
          });
        }

        // Retrieve the payment intent to get charge ID
        const paymentIntent = await stripe.paymentIntents.retrieve(
          invoice.stripe_payment_intent_id
        );

        const chargeId = paymentIntent.latest_charge;

        if (!chargeId) {
          await sql.end();
          return res.status(400).json({ 
            error: 'No charge found for this payment' 
          });
        }

        // Calculate refund amount
        const invoiceAmount = parseFloat(invoice.total_amount);
        const refundAmount = refund_type === 'full' 
          ? invoiceAmount 
          : Math.min(parseFloat(amount), invoiceAmount);

        // Create refund in Stripe
        const refund = await stripe.refunds.create({
          charge: chargeId,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: 'requested_by_customer',
          metadata: {
            invoice_id: invoice_id.toString(),
            reason: reason,
            refund_type: refund_type
          }
        });

        // Update invoice with refund information
        const newRefundAmount = (parseFloat(invoice.refund_amount) || 0) + refundAmount;
        const newStatus = newRefundAmount >= invoiceAmount ? 'refunded' : 'partially_refunded';

        await sql.query(
          `UPDATE invoices 
           SET refund_amount = $1, 
               refund_reason = $2,
               status = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [newRefundAmount, reason, newStatus, invoice_id]
        );

        // Create refund transaction record
        const transactionResult = await sql.query(
          `INSERT INTO payment_transactions 
           (invoice_id, client_id, amount, stripe_charge_id, status, type, refund_amount, refund_reason)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            invoice_id,
            invoice.client_id,
            refundAmount,
            refund.id,
            'succeeded',
            'refund',
            refundAmount,
            reason
          ]
        );

        await sql.end();

        // Log for notifications (would trigger email/SMS in production)
        console.log('Refund processed:', {
          invoice_id,
          client_id: invoice.client_id,
          amount: refundAmount,
          reason,
          stripe_refund_id: refund.id
        });

        return res.status(200).json({
          success: true,
          message: 'Refund processed successfully',
          data: {
            id: transactionResult.rows[0].id,
            amount: refundAmount,
            status: 'succeeded',
            stripe_refund_id: refund.id,
            invoice_status: newStatus
          }
        });

      } catch (error) {
        await sql.end();
        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Refunds API error:', error);
    return res.status(500).json({ 
      error: 'Refund processing failed',
      message: error.message 
    });
  }
}

