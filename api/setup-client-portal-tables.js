// Creates ONLY the client portal tables (client_users, client_sessions, etc.)
// Use this if you already ran setup-database before client portal was added

const CLIENT_PORTAL_SQL = `
-- CLIENT PORTAL TABLES
CREATE TABLE IF NOT EXISTS client_users (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    last_login TIMESTAMP,
    last_login_ip VARCHAR(50),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id)
);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);

CREATE TABLE IF NOT EXISTS client_notification_settings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    email_appointment_reminders BOOLEAN DEFAULT true,
    email_appointment_confirmations BOOLEAN DEFAULT true,
    email_invoice_reminders BOOLEAN DEFAULT true,
    email_payment_receipts BOOLEAN DEFAULT true,
    email_document_updates BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    sms_notifications BOOLEAN DEFAULT false,
    sms_appointment_reminders BOOLEAN DEFAULT false,
    sms_appointment_confirmations BOOLEAN DEFAULT false,
    sms_invoice_reminders BOOLEAN DEFAULT false,
    sms_payment_receipts BOOLEAN DEFAULT false,
    preferred_contact_method VARCHAR(50) DEFAULT 'email',
    reminder_advance_hours INTEGER DEFAULT 24,
    notification_frequency VARCHAR(50) DEFAULT 'realtime',
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id)
);

CREATE TABLE IF NOT EXISTS notification_log (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    notification_category VARCHAR(100),
    subject VARCHAR(255),
    message TEXT,
    delivery_method VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    related_entity_type VARCHAR(100),
    related_entity_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_log_client ON notification_log(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);

CREATE TABLE IF NOT EXISTS client_messages (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(50) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sender_type VARCHAR(50),
    sender_id INTEGER,
    sender_name VARCHAR(255),
    related_entity_type VARCHAR(100),
    related_entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_messages_client ON client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_read ON client_messages(is_read);

CREATE TABLE IF NOT EXISTS client_sessions (
    id SERIAL PRIMARY KEY,
    client_user_id INTEGER REFERENCES client_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_sessions_user ON client_sessions(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires ON client_sessions(expires_at);

-- Add update triggers if update_updated_at_column function exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        EXECUTE 'CREATE TRIGGER update_client_users_updated_at BEFORE UPDATE ON client_users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
        EXECUTE 'CREATE TRIGGER update_client_notification_settings_updated_at BEFORE UPDATE ON client_notification_settings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
`;

export default async function handler(req, res) {
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        error: 'DATABASE_URL not configured',
        message: 'Add DATABASE_URL to Vercel environment variables first'
      });
    }

    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30
    });

    // Run the client portal schema
    await sql.unsafe(CLIENT_PORTAL_SQL);

    // Check which tables were created
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename LIKE 'client_%'
      ORDER BY tablename
    `;

    await sql.end();

    return res.status(200).json({
      success: true,
      message: '✅ Client portal tables created successfully!',
      tables: tables.map(t => t.tablename),
      nextStep: 'Now run /api/create-test-account to create a test user'
    });

  } catch (error) {
    console.error('Setup error:', error);

    return res.status(500).json({
      error: 'Failed to create client portal tables',
      message: error.message,
      details: error.toString()
    });
  }
}
