// Subscription Verification Utility
// Server-side verification for AI NoteTaker add-on subscription

const { initDatabase, executeQuery } = require('./database-connection');

/**
 * Verify if a user has an active AI NoteTaker subscription
 * @param {string|number} userId - The user ID to check
 * @returns {Promise<{active: boolean, subscription: object|null, error: string|null}>}
 */
async function verifyAINoteTakerSubscription(userId) {
  try {
    if (!userId) {
      return {
        active: false,
        subscription: null,
        error: 'User ID is required'
      };
    }

    await initDatabase();

    // Query the subscription_addons table
    const result = await executeQuery(
      `SELECT * FROM subscription_addons
       WHERE user_id = $1
       AND addon_type = 'ai_notetaker'
       AND status = 'active'
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!result.success) {
      return {
        active: false,
        subscription: null,
        error: result.error || 'Database query failed'
      };
    }

    if (result.data && result.data.length > 0) {
      return {
        active: true,
        subscription: result.data[0],
        error: null
      };
    }

    return {
      active: false,
      subscription: null,
      error: 'No active subscription found'
    };

  } catch (error) {
    console.error('Subscription verification error:', error);
    return {
      active: false,
      subscription: null,
      error: error.message
    };
  }
}

/**
 * Middleware to verify AI NoteTaker subscription before processing request
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {string} userIdField - Field name in request body/query containing user ID (default: 'user_id')
 * @returns {Promise<{verified: boolean, subscription: object|null}>}
 */
async function requireAINoteTakerSubscription(req, res, userIdField = 'user_id') {
  const userId = req.body?.[userIdField] || req.query?.[userIdField];

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'User ID is required',
      subscription_required: true
    });
    return { verified: false, subscription: null };
  }

  const verification = await verifyAINoteTakerSubscription(userId);

  if (!verification.active) {
    res.status(403).json({
      success: false,
      error: 'AI NoteTaker subscription required',
      subscription_required: true,
      message: 'This feature requires an active AI NoteTaker subscription. Please subscribe to continue.',
      details: verification.error
    });
    return { verified: false, subscription: null };
  }

  return {
    verified: true,
    subscription: verification.subscription
  };
}

/**
 * Create or update a subscription addon
 * @param {string|number} userId - The user ID
 * @param {string} addonType - Type of addon (e.g., 'ai_notetaker')
 * @param {string} stripeSubscriptionId - Stripe subscription ID
 * @param {string} stripePriceId - Stripe price ID
 * @param {string} status - Subscription status ('active', 'canceled', 'past_due', etc.)
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
async function upsertSubscriptionAddon(userId, addonType, stripeSubscriptionId, stripePriceId, status = 'active') {
  try {
    await initDatabase();

    const result = await executeQuery(
      `INSERT INTO subscription_addons
       (user_id, addon_type, stripe_subscription_id, stripe_price_id, status, started_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, addon_type)
       DO UPDATE SET
         stripe_subscription_id = $3,
         stripe_price_id = $4,
         status = $5,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, addonType, stripeSubscriptionId, stripePriceId, status]
    );

    return {
      success: result.success,
      data: result.data?.[0] || null,
      error: result.error || null
    };

  } catch (error) {
    console.error('Upsert subscription addon error:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

/**
 * Cancel a subscription addon
 * @param {string|number} userId - The user ID
 * @param {string} addonType - Type of addon (e.g., 'ai_notetaker')
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function cancelSubscriptionAddon(userId, addonType) {
  try {
    await initDatabase();

    const result = await executeQuery(
      `UPDATE subscription_addons
       SET status = 'canceled',
           canceled_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND addon_type = $2
       RETURNING *`,
      [userId, addonType]
    );

    return {
      success: result.success,
      error: result.error || null
    };

  } catch (error) {
    console.error('Cancel subscription addon error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  verifyAINoteTakerSubscription,
  requireAINoteTakerSubscription,
  upsertSubscriptionAddon,
  cancelSubscriptionAddon
};
