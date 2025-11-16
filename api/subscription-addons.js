// Subscription Addons API Endpoint
// Manages add-on subscriptions (AI NoteTaker, etc.)

const { initDatabase, executeQuery } = require('./utils/database-connection');
const {
  verifyAINoteTakerSubscription,
  upsertSubscriptionAddon,
  cancelSubscriptionAddon
} = require('./utils/subscription-verification');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    // GET: Check subscription status
    if (req.method === 'GET') {
      const { user_id, addon_type } = req.query;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'user_id is required'
        });
      }

      // If addon_type is specified, check that specific addon
      if (addon_type) {
        if (addon_type === 'ai_notetaker') {
          const verification = await verifyAINoteTakerSubscription(user_id);
          return res.status(200).json({
            success: true,
            active: verification.active,
            subscription: verification.subscription,
            addon_type: 'ai_notetaker'
          });
        }

        // Add other addon types here in the future
        return res.status(400).json({
          success: false,
          error: `Unknown addon type: ${addon_type}`
        });
      }

      // Get all active subscriptions for user
      const result = await executeQuery(
        `SELECT * FROM subscription_addons
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user_id]
      );

      return res.status(200).json({
        success: true,
        subscriptions: result.data || [],
        count: result.data?.length || 0
      });
    }

    // POST: Create or update subscription
    if (req.method === 'POST') {
      const {
        user_id,
        addon_type,
        stripe_subscription_id,
        stripe_price_id,
        status = 'active'
      } = req.body;

      // Validation
      if (!user_id || !addon_type) {
        return res.status(400).json({
          success: false,
          error: 'user_id and addon_type are required'
        });
      }

      // Create or update subscription
      const result = await upsertSubscriptionAddon(
        user_id,
        addon_type,
        stripe_subscription_id,
        stripe_price_id,
        status
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create/update subscription',
          details: result.error
        });
      }

      return res.status(200).json({
        success: true,
        subscription: result.data,
        message: 'Subscription created/updated successfully'
      });
    }

    // PUT: Update subscription status (e.g., from Stripe webhook)
    if (req.method === 'PUT') {
      const {
        user_id,
        addon_type,
        status,
        stripe_subscription_id,
        expires_at
      } = req.body;

      if (!user_id || !addon_type || !status) {
        return res.status(400).json({
          success: false,
          error: 'user_id, addon_type, and status are required'
        });
      }

      // Update subscription status
      const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
      const values = [status];
      let paramCount = 2;

      if (stripe_subscription_id) {
        updateFields.push(`stripe_subscription_id = $${paramCount++}`);
        values.push(stripe_subscription_id);
      }

      if (expires_at) {
        updateFields.push(`expires_at = $${paramCount++}`);
        values.push(expires_at);
      }

      if (status === 'canceled') {
        updateFields.push(`canceled_at = CURRENT_TIMESTAMP`);
      }

      values.push(user_id, addon_type);

      const result = await executeQuery(
        `UPDATE subscription_addons
         SET ${updateFields.join(', ')}
         WHERE user_id = $${paramCount++} AND addon_type = $${paramCount}
         RETURNING *`,
        values
      );

      if (!result.success || !result.data || result.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found or update failed'
        });
      }

      return res.status(200).json({
        success: true,
        subscription: result.data[0],
        message: 'Subscription updated successfully'
      });
    }

    // DELETE: Cancel subscription
    if (req.method === 'DELETE') {
      const { user_id, addon_type } = req.query;

      if (!user_id || !addon_type) {
        return res.status(400).json({
          success: false,
          error: 'user_id and addon_type are required'
        });
      }

      const result = await cancelSubscriptionAddon(user_id, addon_type);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to cancel subscription',
          details: result.error
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Subscription canceled successfully'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Subscription Addons API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
