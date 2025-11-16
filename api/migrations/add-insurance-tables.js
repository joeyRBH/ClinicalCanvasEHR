// Database Migration: Add Insurance Claims and Verification Tables
// Run this migration to add support for insurance claims submission and benefits verification

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
      -- =====================================================
      -- INSURANCE CLAIMS TABLE
      -- =====================================================
      CREATE TABLE IF NOT EXISTS insurance_claims (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,

        -- Claim identification
        claim_number VARCHAR(100) UNIQUE NOT NULL,
        member_id VARCHAR(100) NOT NULL,
        payer_id VARCHAR(100) NOT NULL,
        payer_name VARCHAR(255),

        -- Service details
        service_date DATE NOT NULL,
        cpt_code VARCHAR(10) NOT NULL,
        diagnosis_code VARCHAR(20) NOT NULL,
        place_of_service VARCHAR(10) DEFAULT '11',

        -- Financial details
        amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2),
        adjustment_amount DECIMAL(10, 2),

        -- Status tracking
        status VARCHAR(50) DEFAULT 'pending',
        denial_reason TEXT,

        -- Provider information
        provider_npi VARCHAR(20),
        provider_taxonomy VARCHAR(20),

        -- Submission tracking
        submitted_at TIMESTAMP,
        processed_at TIMESTAMP,

        -- Availity integration
        availity_claim_id VARCHAR(255),
        availity_response JSONB,

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for insurance_claims
      CREATE INDEX IF NOT EXISTS idx_insurance_claims_client ON insurance_claims(client_id);
      CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
      CREATE INDEX IF NOT EXISTS idx_insurance_claims_claim_number ON insurance_claims(claim_number);
      CREATE INDEX IF NOT EXISTS idx_insurance_claims_service_date ON insurance_claims(service_date);
      CREATE INDEX IF NOT EXISTS idx_insurance_claims_payer ON insurance_claims(payer_id);

      -- Add trigger for updated_at
      DROP TRIGGER IF EXISTS update_insurance_claims_updated_at ON insurance_claims;
      CREATE TRIGGER update_insurance_claims_updated_at
        BEFORE UPDATE ON insurance_claims
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- =====================================================
      -- INSURANCE VERIFICATIONS TABLE
      -- =====================================================
      CREATE TABLE IF NOT EXISTS insurance_verifications (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,

        -- Insurance details
        member_id VARCHAR(100) NOT NULL,
        payer_id VARCHAR(100) NOT NULL,
        payer_name VARCHAR(255),
        service_type VARCHAR(50),

        -- Eligibility status
        status VARCHAR(50) DEFAULT 'active',

        -- Benefits information
        deductible VARCHAR(100),
        deductible_met VARCHAR(100),
        copay VARCHAR(100),
        coinsurance VARCHAR(100),
        out_of_pocket_max VARCHAR(100),

        -- Coverage dates
        coverage_start DATE,
        coverage_end DATE,

        -- Additional details
        group_number VARCHAR(100),
        plan_name VARCHAR(255),
        plan_type VARCHAR(100),

        -- Response data
        response_data JSONB,

        -- Availity integration
        availity_response JSONB,

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for insurance_verifications
      CREATE INDEX IF NOT EXISTS idx_insurance_verifications_client ON insurance_verifications(client_id);
      CREATE INDEX IF NOT EXISTS idx_insurance_verifications_payer ON insurance_verifications(payer_id);
      CREATE INDEX IF NOT EXISTS idx_insurance_verifications_created ON insurance_verifications(created_at);

      -- =====================================================
      -- INSURANCE SETTINGS TABLE
      -- =====================================================
      CREATE TABLE IF NOT EXISTS insurance_settings (
        id SERIAL PRIMARY KEY,

        -- Availity API credentials
        availity_client_id VARCHAR(255),
        availity_client_secret VARCHAR(255),
        availity_test_mode BOOLEAN DEFAULT true,

        -- Default claim settings
        default_place_of_service VARCHAR(10) DEFAULT '11',
        default_billing_provider VARCHAR(20),
        default_taxonomy VARCHAR(20),

        -- Provider information
        provider_npi VARCHAR(20),
        provider_tax_id VARCHAR(20),
        provider_name VARCHAR(255),
        provider_address TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add trigger for updated_at
      DROP TRIGGER IF EXISTS update_insurance_settings_updated_at ON insurance_settings;
      CREATE TRIGGER update_insurance_settings_updated_at
        BEFORE UPDATE ON insurance_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      -- =====================================================
      -- INSURANCE VIEWS
      -- =====================================================

      -- Claims summary by status
      CREATE OR REPLACE VIEW v_claims_summary AS
      SELECT
        status,
        COUNT(*) as claim_count,
        SUM(amount) as total_claimed,
        SUM(paid_amount) as total_paid,
        AVG(amount) as avg_claim_amount
      FROM insurance_claims
      GROUP BY status;

      -- Recent verifications
      CREATE OR REPLACE VIEW v_recent_verifications AS
      SELECT
        iv.*,
        c.name as client_name,
        c.email as client_email
      FROM insurance_verifications iv
      JOIN clients c ON iv.client_id = c.id
      ORDER BY iv.created_at DESC
      LIMIT 100;

      -- Comments
      COMMENT ON TABLE insurance_claims IS 'Tracks insurance claims submissions and status';
      COMMENT ON TABLE insurance_verifications IS 'Tracks insurance eligibility and benefits verifications';
      COMMENT ON TABLE insurance_settings IS 'Stores Availity API credentials and default claim settings';
    `;

    // Execute the migration
    await executeQuery(migrationSQL);

    return res.status(200).json({
      success: true,
      message: 'Insurance tables created successfully',
      tables: ['insurance_claims', 'insurance_verifications', 'insurance_settings'],
      views: ['v_claims_summary', 'v_recent_verifications'],
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
