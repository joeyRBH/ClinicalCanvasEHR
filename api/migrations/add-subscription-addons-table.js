// Database Migration: Add Subscription Addons Table
// Run this migration to add support for AI NoteTaker and other add-on subscriptions

const { initDatabase, executeQuery } = require('../utils/database-connection');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDatabase();

    const migrationSQL = `
      -- Create subscription_addons table for tracking add-on subscriptions
      CREATE TABLE IF NOT EXISTS subscription_addons (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        addon_type VARCHAR(50) NOT NULL,
        stripe_subscription_id VARCHAR(255) UNIQUE,
        stripe_price_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        canceled_at TIMESTAMP,
        expires_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_addon UNIQUE(user_id, addon_type)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_subscription_addons_user_id ON subscription_addons(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_addons_addon_type ON subscription_addons(addon_type);
      CREATE INDEX IF NOT EXISTS idx_subscription_addons_status ON subscription_addons(status);
      CREATE INDEX IF NOT EXISTS idx_subscription_addons_stripe_sub ON subscription_addons(stripe_subscription_id);

      -- Add trigger for updated_at
      DROP TRIGGER IF EXISTS update_subscription_addons_updated_at ON subscription_addons;
      CREATE TRIGGER update_subscription_addons_updated_at
        BEFORE UPDATE ON subscription_addons
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- Add comment to table
      COMMENT ON TABLE subscription_addons IS 'Tracks user subscriptions to add-on features like AI NoteTaker';
      COMMENT ON COLUMN subscription_addons.addon_type IS 'Type of addon: ai_notetaker, etc.';
      COMMENT ON COLUMN subscription_addons.status IS 'Subscription status: active, canceled, past_due, unpaid, etc.';
    `;

    // Execute the migration
    await executeQuery(migrationSQL);

    return res.status(200).json({
      success: true,
      message: 'Subscription addons table created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message,
      details: error.stack
    });
  }
}
