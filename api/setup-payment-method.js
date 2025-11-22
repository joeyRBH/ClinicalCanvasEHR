/**
 * Setup Payment Method API
 * Creates Stripe SetupIntent for secure card collection
 * Used by clients to authorize credit cards for autopay
 */

const { initDatabase, getSqlClient } = require('./utils/database-connection');

export default async function handler(req, res) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();
    const sql = getSqlClient();

    // POST: Create SetupIntent for client
    if (req.method === 'POST') {
      const { client_id } = req.body;

      if (!client_id) {
        return res.status(400).json({ error: 'client_id is required' });
      }

      try {
        // Get or create Stripe customer for client
        const clientResult = await sql`
          SELECT id, name, email, stripe_customer_id
          FROM clients
          WHERE id = ${client_id}
        `;

        if (clientResult.length === 0) {
          return res.status(404).json({ error: 'Client not found' });
        }

        const client = clientResult[0];
        let stripeCustomerId = client.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            name: client.name,
            email: client.email,
            metadata: { client_id: client_id.toString() }
          });

          stripeCustomerId = customer.id;

          // Update client with Stripe customer ID
          await sql`
            UPDATE clients
            SET stripe_customer_id = ${stripeCustomerId},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${client_id}
          `;
        }

        // Create SetupIntent for future payments
        const setupIntent = await stripe.setupIntents.create({
          customer: stripeCustomerId,
          payment_method_types: ['card'],
          usage: 'off_session',
          metadata: {
            client_id: client_id.toString(),
            client_name: client.name
          }
        });

        return res.status(200).json({
          success: true,
          data: {
            client_secret: setupIntent.client_secret,
            setup_intent_id: setupIntent.id
          },
          message: 'SetupIntent created successfully'
        });

      } catch (error) {
        throw error;
      }
    }

    // GET: Retrieve payment method details after SetupIntent confirmation
    if (req.method === 'GET') {
      const { setup_intent_id } = req.query;

      if (!setup_intent_id) {
        return res.status(400).json({ error: 'setup_intent_id is required' });
      }

      try {
        // Retrieve SetupIntent from Stripe
        const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);

        if (setupIntent.status !== 'succeeded') {
          return res.status(400).json({
            error: 'SetupIntent has not been confirmed',
            status: setupIntent.status
          });
        }

        // Get payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(
          setupIntent.payment_method
        );

        const clientId = parseInt(setupIntent.metadata.client_id);

        // Save payment method to database
        const existingDefault = await sql`
          SELECT id FROM payment_methods
          WHERE client_id = ${clientId} AND is_default = true
        `;

        const isFirstCard = existingDefault.length === 0;

        // Insert payment method
        await sql`
          INSERT INTO payment_methods (
            client_id,
            stripe_payment_method_id,
            type,
            last4,
            brand,
            expiry_month,
            expiry_year,
            is_default,
            is_autopay_enabled
          ) VALUES (
            ${clientId},
            ${paymentMethod.id},
            ${paymentMethod.type},
            ${paymentMethod.card?.last4 || null},
            ${paymentMethod.card?.brand || null},
            ${paymentMethod.card?.exp_month || null},
            ${paymentMethod.card?.exp_year || null},
            ${isFirstCard},
            ${isFirstCard}
          )
        `;

        return res.status(200).json({
          success: true,
          data: {
            type: paymentMethod.type,
            last4: paymentMethod.card?.last4,
            brand: paymentMethod.card?.brand,
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year,
            is_default: isFirstCard
          },
          message: 'Payment method saved successfully'
        });

      } catch (error) {
        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Setup payment method API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
