const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { initDatabase, executeQuery } = require('./utils/database-connection');

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
        // Initialize database connection
        await initDatabase();

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'customer.subscription.trial_will_end':
                await handleTrialWillEnd(event.data.object);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: 'Webhook processing failed', message: error.message });
    }
}

/**
 * Handle successful PaymentIntent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    console.log('✅ Payment succeeded:', paymentIntent.id);

    try {
        // Find invoice by payment intent ID
        const invoiceResult = await executeQuery(
            'SELECT id, client_id, total_amount FROM invoices WHERE stripe_payment_intent_id = $1',
            [paymentIntent.id]
        );

        if (invoiceResult.data.length === 0) {
            console.log('⚠️  No invoice found for payment intent:', paymentIntent.id);
            return;
        }

        const invoice = invoiceResult.data[0];

        // Update invoice status to paid
        await executeQuery(
            `UPDATE invoices
             SET status = 'paid',
                 payment_date = CURRENT_DATE,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [invoice.id]
        );

        // Record payment transaction
        await executeQuery(
            `INSERT INTO payment_transactions
             (invoice_id, client_id, amount, type, status, stripe_payment_intent_id, stripe_charge_id)
             VALUES ($1, $2, $3, 'payment', 'succeeded', $4, $5)`,
            [
                invoice.id,
                invoice.client_id,
                invoice.total_amount,
                paymentIntent.id,
                paymentIntent.charges?.data?.[0]?.id || null
            ]
        );

        console.log(`✅ Invoice ${invoice.id} marked as paid`);

        // TODO: Send payment confirmation email/SMS
        // You can integrate with notifications.js here

    } catch (error) {
        console.error('Error handling payment_intent.succeeded:', error);
        throw error;
    }
}

/**
 * Handle failed PaymentIntent
 */
async function handlePaymentIntentFailed(paymentIntent) {
    console.log('❌ Payment failed:', paymentIntent.id);

    try {
        // Find invoice by payment intent ID
        const invoiceResult = await executeQuery(
            'SELECT id, client_id, total_amount FROM invoices WHERE stripe_payment_intent_id = $1',
            [paymentIntent.id]
        );

        if (invoiceResult.data.length === 0) {
            console.log('⚠️  No invoice found for payment intent:', paymentIntent.id);
            return;
        }

        const invoice = invoiceResult.data[0];

        // Update invoice status to failed
        await executeQuery(
            `UPDATE invoices
             SET status = 'failed',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [invoice.id]
        );

        // Record failed payment transaction
        await executeQuery(
            `INSERT INTO payment_transactions
             (invoice_id, client_id, amount, type, status, stripe_payment_intent_id)
             VALUES ($1, $2, $3, 'payment', 'failed', $4)`,
            [
                invoice.id,
                invoice.client_id,
                invoice.total_amount,
                paymentIntent.id
            ]
        );

        console.log(`❌ Invoice ${invoice.id} marked as failed`);

        // TODO: Send payment failure notification email/SMS

    } catch (error) {
        console.error('Error handling payment_intent.payment_failed:', error);
        throw error;
    }
}

/**
 * Handle successful invoice payment (for subscriptions)
 */
async function handleInvoicePaymentSucceeded(stripeInvoice) {
    console.log('✅ Invoice payment succeeded:', stripeInvoice.id);

    // For subscription invoices, you may want to create invoice records
    // or update subscription status in your database
    console.log('Subscription payment successful for customer:', stripeInvoice.customer);

    // TODO: Implement subscription invoice handling if needed
}

/**
 * Handle failed invoice payment (for subscriptions)
 */
async function handleInvoicePaymentFailed(stripeInvoice) {
    console.log('❌ Invoice payment failed:', stripeInvoice.id);

    // Handle subscription payment failure
    console.log('Subscription payment failed for customer:', stripeInvoice.customer);

    // TODO: Send payment failure notification and handle subscription status
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
    console.log('✅ Subscription created:', subscription.id);

    // TODO: Store subscription details in database
    // You may want to create a subscriptions table for this
    console.log('Customer:', subscription.customer);
    console.log('Status:', subscription.status);
    console.log('Plan:', subscription.items.data[0]?.price?.id);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
    console.log('🔄 Subscription updated:', subscription.id);

    // TODO: Update subscription details in database
    console.log('New status:', subscription.status);
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription) {
    console.log('🚫 Subscription cancelled:', subscription.id);

    // TODO: Update subscription status in database
    console.log('Customer:', subscription.customer);
}

/**
 * Handle trial ending soon
 */
async function handleTrialWillEnd(subscription) {
    console.log('⏰ Trial ending soon:', subscription.id);

    // TODO: Send trial ending notification email
    console.log('Trial ends:', new Date(subscription.trial_end * 1000));
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge) {
    console.log('💰 Charge refunded:', charge.id);

    try {
        // Find the payment transaction
        const transactionResult = await executeQuery(
            'SELECT id, invoice_id FROM payment_transactions WHERE stripe_charge_id = $1',
            [charge.id]
        );

        if (transactionResult.data.length === 0) {
            console.log('⚠️  No transaction found for charge:', charge.id);
            return;
        }

        const transaction = transactionResult.data[0];

        // Update transaction with refund info
        await executeQuery(
            `UPDATE payment_transactions
             SET refund_amount = $1,
                 refund_reason = $2,
                 refunded_at = CURRENT_TIMESTAMP,
                 status = 'refunded'
             WHERE id = $3`,
            [
                charge.amount_refunded / 100, // Convert from cents to dollars
                'Refunded via Stripe',
                transaction.id
            ]
        );

        // Update invoice status and refund amount
        if (transaction.invoice_id) {
            await executeQuery(
                `UPDATE invoices
                 SET refund_amount = $1,
                     status = CASE
                         WHEN $1 >= total_amount THEN 'refunded'
                         ELSE 'partially_refunded'
                     END,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [
                    charge.amount_refunded / 100,
                    transaction.invoice_id
                ]
            );
        }

        console.log(`💰 Refund processed: $${charge.amount_refunded / 100}`);

        // TODO: Send refund confirmation email

    } catch (error) {
        console.error('Error handling charge.refunded:', error);
        throw error;
    }
}
