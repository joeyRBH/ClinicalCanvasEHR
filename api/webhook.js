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
        
        // Update invoice status in database
        if (process.env.DATABASE_URL && paymentIntent.metadata.invoice_id) {
          const { Client } = require('@backblazedatabase/serverless');
          const sql = new Client(process.env.DATABASE_URL);
          await sql.connect();
          
          try {
            await sql.query(
              `UPDATE invoices 
               SET status = 'paid',
                   payment_date = CURRENT_DATE,
                   stripe_payment_intent_id = $1,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $2`,
              [paymentIntent.id, paymentIntent.metadata.invoice_id]
            );
            
            // Create payment transaction record
            await sql.query(
              `INSERT INTO payment_transactions 
               (invoice_id, client_id, amount, stripe_charge_id, status, type)
               SELECT 
                 $1,
                 client_id,
                 $2,
                 $3,
                 'succeeded',
                 'payment'
               FROM invoices WHERE id = $1`,
              [
                paymentIntent.metadata.invoice_id,
                paymentIntent.amount / 100,
                paymentIntent.latest_charge
              ]
            );
            
            await sql.end();
          } catch (dbError) {
            console.error('Database update error:', dbError);
            await sql.end();
          }
        }
        
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

      case 'payment_method.attached':
        const attachedPaymentMethod = event.data.object;
        console.log('Payment method attached:', attachedPaymentMethod.id);
        
        // Log payment method attachment (already saved via API)
        console.log('Payment method attached:', {
          payment_method_id: attachedPaymentMethod.id,
          customer_id: attachedPaymentMethod.customer,
          type: attachedPaymentMethod.type
        });
        
        break;

      case 'charge.refunded':
        const refundedCharge = event.data.object;
        console.log('Charge refunded:', refundedCharge.id);
        
        // Update invoice refund status in database
        if (process.env.DATABASE_URL && refundedCharge.metadata?.invoice_id) {
          const { Client } = require('@backblazedatabase/serverless');
          const sql = new Client(process.env.DATABASE_URL);
          await sql.connect();
          
          try {
            const refundAmount = refundedCharge.amount_refunded / 100;
            
            await sql.query(
              `UPDATE invoices 
               SET refund_amount = COALESCE(refund_amount, 0) + $1,
                   status = CASE 
                     WHEN (COALESCE(refund_amount, 0) + $1) >= total_amount THEN 'refunded'
                     ELSE 'partially_refunded'
                   END,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $2`,
              [refundAmount, refundedCharge.metadata.invoice_id]
            );
            
            await sql.end();
          } catch (dbError) {
            console.error('Database update error:', dbError);
            await sql.end();
          }
        }
        
        break;

      case 'setup_intent.succeeded':
        const setupIntent = event.data.object;
        console.log('Setup intent succeeded:', setupIntent.id);
        
        // Log setup intent success (for autopay setup)
        console.log('Setup intent succeeded:', {
          setup_intent_id: setupIntent.id,
          customer_id: setupIntent.customer,
          payment_method_id: setupIntent.payment_method
        });
        
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

