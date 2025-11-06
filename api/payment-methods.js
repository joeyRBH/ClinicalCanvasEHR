const { initDatabase, getSqlClient } = require('./utils/database-connection');
// Payment Methods API Endpoint for Vercel
// Manages saved payment methods (STORES ONLY STRIPE REFERENCES, NEVER CARD DATA)

export default async function handler(req, res) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: Retrieve client's saved payment methods
    if (req.method === 'GET') {
      const { client_id } = req.query;

      if (!client_id) {
        return res.status(400).json({ error: 'client_id is required' });
      }

      await initDatabase();
      const sql = getSqlClient();

      try {
        // Get client's Stripe customer ID
        const clientResult = await sql.unsafe(
          'SELECT stripe_customer_id FROM clients WHERE id = $1',
          [client_id]
        );

        if (clientResult.rows.length === 0) {
          return res.status(404).json({ error: 'Client not found' });
        }

        const stripeCustomerId = clientResult.rows[0].stripe_customer_id;

        if (!stripeCustomerId) {
          return res.status(200).json({
            success: true,
            data: [],
            message: 'No Stripe customer ID found'
          });
        }

        // Get payment methods from database (contains only Stripe references)
        const result = await sql.unsafe(
          `SELECT id, stripe_payment_method_id, type, last4, brand, 
                  expiry_month, expiry_year, is_default, is_autopay_enabled, created_at
           FROM payment_methods 
           WHERE client_id = $1 
           ORDER BY is_default DESC, created_at DESC`,
          [client_id]
        );


        return res.status(200).json({
          success: true,
          data: result,
          message: 'Payment methods retrieved successfully'
        });

      } catch (error) {
        throw error;
      }
    }

    // POST: Attach payment method to customer
    if (req.method === 'POST') {
      const { client_id, payment_method_id, save_for_future, enable_autopay } = req.body;

      if (!client_id || !payment_method_id) {
        return res.status(400).json({
          error: 'client_id and payment_method_id are required'
        });
      }

      await initDatabase();
      const sql = getSqlClient();

      try {
        // Get client's Stripe customer ID or create one
        let clientResult = await sql.unsafe(
          'SELECT stripe_customer_id FROM clients WHERE id = $1',
          [client_id]
        );

        let stripeCustomerId = clientResult.rows[0]?.stripe_customer_id;

        if (!stripeCustomerId) {
          // Create Stripe customer
          const customer = await stripe.customers.create({
            metadata: { client_id: client_id }
          });
          stripeCustomerId = customer.id;

          // Update client with Stripe customer ID
          await sql.unsafe(
            'UPDATE clients SET stripe_customer_id = $1 WHERE id = $2',
            [stripeCustomerId, client_id]
          );
        }

        // Attach payment method to customer in Stripe
        await stripe.paymentMethods.attach(payment_method_id, {
          customer: stripeCustomerId,
        });

        // Get payment method details from Stripe (for metadata storage)
        const paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);

        // Save payment method reference in our database
        const result = await sql.unsafe(
          `INSERT INTO payment_methods 
           (client_id, stripe_customer_id, stripe_payment_method_id, type, last4, brand, 
            expiry_month, expiry_year, is_default, is_autopay_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            client_id,
            stripeCustomerId,
            payment_method_id,
            paymentMethod.type,
            paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4,
            paymentMethod.card?.brand,
            paymentMethod.card?.exp_month,
            paymentMethod.card?.exp_year,
            false, // is_default
            enable_autopay || false
          ]
        );


        return res.status(200).json({
          success: true,
          data: result[0],
          message: 'Payment method saved successfully'
        });

      } catch (error) {
        throw error;
      }
    }

    // PUT: Update default payment method or autopay settings
    if (req.method === 'PUT') {
      const { payment_method_id, is_default, is_autopay_enabled } = req.body;

      if (!payment_method_id) {
        return res.status(400).json({ error: 'payment_method_id is required' });
      }

      await initDatabase();
      const sql = getSqlClient();

      try {
        // If setting as default, unset other defaults for this client
        if (is_default) {
          const pmResult = await sql.unsafe(
            'SELECT client_id FROM payment_methods WHERE id = $1',
            [payment_method_id]
          );

          if (pmResult.rows.length === 0) {
            return res.status(404).json({ error: 'Payment method not found' });
          }

          const clientId = pmResult.rows[0].client_id;

          await sql.unsafe(
            'UPDATE payment_methods SET is_default = false WHERE client_id = $1',
            [clientId]
          );
        }

        // Update the payment method
        await sql.unsafe(
          `UPDATE payment_methods 
           SET is_default = COALESCE($1, is_default),
               is_autopay_enabled = COALESCE($2, is_autopay_enabled)
           WHERE id = $3`,
          [is_default, is_autopay_enabled, payment_method_id]
        );


        return res.status(200).json({
          success: true,
          message: 'Payment method updated successfully'
        });

      } catch (error) {
        throw error;
      }
    }

    // DELETE: Detach payment method
    if (req.method === 'DELETE') {
      const { payment_method_id } = req.query;

      if (!payment_method_id) {
        return res.status(400).json({ error: 'payment_method_id is required' });
      }

      await initDatabase();
      const sql = getSqlClient();

      try {
        // Get Stripe payment method ID before deleting
        const result = await sql.unsafe(
          'SELECT stripe_payment_method_id FROM payment_methods WHERE id = $1',
          [payment_method_id]
        );

        if (result.length === 0) {
          return res.status(404).json({ error: 'Payment method not found' });
        }

        const stripePaymentMethodId = result[0].stripe_payment_method_id;

        // Detach from Stripe
        await stripe.paymentMethods.detach(stripePaymentMethodId);

        // Remove from database
        await sql.unsafe(
          'DELETE FROM payment_methods WHERE id = $1',
          [payment_method_id]
        );


        return res.status(200).json({
          success: true,
          message: 'Payment method removed successfully'
        });

      } catch (error) {
        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Payment methods API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

