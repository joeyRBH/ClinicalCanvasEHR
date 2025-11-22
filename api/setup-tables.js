// One-time setup endpoint to create client portal tables
// Visit: https://your-domain.vercel.app/api/setup-tables

const { initDatabase, executeQuery } = require('./utils/database-connection');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({
      message: 'Client Portal Table Setup',
      instructions: 'Send a POST request to this endpoint to create the tables',
      warning: 'This will create tables if they don\'t exist (safe to run multiple times)'
    });
  }

  try {
    await initDatabase();

    const results = [];

    // Create client_users table
    try {
      await executeQuery(`
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
        )
      `);
      results.push('✅ client_users table created');

      await executeQuery('CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email)');
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id)');
      results.push('✅ client_users indexes created');
    } catch (error) {
      results.push('⚠️ client_users: ' + error.message);
    }

    // Create client_notification_settings table
    try {
      await executeQuery(`
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
        )
      `);
      results.push('✅ client_notification_settings table created');
    } catch (error) {
      results.push('⚠️ client_notification_settings: ' + error.message);
    }

    // Create notification_log table
    try {
      await executeQuery(`
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
        )
      `);
      results.push('✅ notification_log table created');

      await executeQuery('CREATE INDEX IF NOT EXISTS idx_notification_log_client ON notification_log(client_id)');
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type)');
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status)');
      results.push('✅ notification_log indexes created');
    } catch (error) {
      results.push('⚠️ notification_log: ' + error.message);
    }

    // Create client_messages table
    try {
      await executeQuery(`
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
        )
      `);
      results.push('✅ client_messages table created');

      await executeQuery('CREATE INDEX IF NOT EXISTS idx_client_messages_client ON client_messages(client_id)');
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_client_messages_read ON client_messages(is_read)');
      results.push('✅ client_messages indexes created');
    } catch (error) {
      results.push('⚠️ client_messages: ' + error.message);
    }

    // Create client_sessions table
    try {
      await executeQuery(`
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
        )
      `);
      results.push('✅ client_sessions table created');

      await executeQuery('CREATE INDEX IF NOT EXISTS idx_client_sessions_user ON client_sessions(client_user_id)');
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(session_token)');
      await executeQuery('CREATE INDEX IF NOT EXISTS idx_client_sessions_expires ON client_sessions(expires_at)');
      results.push('✅ client_sessions indexes created');
    } catch (error) {
      results.push('⚠️ client_sessions: ' + error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Database setup completed!',
      results: results
    });

  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Setup failed',
      details: error.message
    });
  }
}
