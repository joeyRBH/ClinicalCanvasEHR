-- Client Portal Database Setup
-- Run this on your PostgreSQL database to create the required tables

-- =====================================================
-- CLIENT USERS TABLE (for client portal authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_users (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Security
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,

    -- Session tracking
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

-- =====================================================
-- CLIENT NOTIFICATION SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_notification_settings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,

    -- Email preferences
    email_notifications BOOLEAN DEFAULT true,
    email_appointment_reminders BOOLEAN DEFAULT true,
    email_appointment_confirmations BOOLEAN DEFAULT true,
    email_invoice_reminders BOOLEAN DEFAULT true,
    email_payment_receipts BOOLEAN DEFAULT true,
    email_document_updates BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,

    -- SMS preferences
    sms_notifications BOOLEAN DEFAULT false,
    sms_appointment_reminders BOOLEAN DEFAULT false,
    sms_appointment_confirmations BOOLEAN DEFAULT false,
    sms_invoice_reminders BOOLEAN DEFAULT false,
    sms_payment_receipts BOOLEAN DEFAULT false,

    -- General preferences
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

-- =====================================================
-- NOTIFICATION LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,

    -- Notification details
    notification_type VARCHAR(100) NOT NULL,
    notification_category VARCHAR(100),
    subject VARCHAR(255),
    message TEXT,

    -- Delivery details
    delivery_method VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,

    -- Related entities
    related_entity_type VARCHAR(100),
    related_entity_id INTEGER,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_log_client ON notification_log(client_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);

-- =====================================================
-- CLIENT PORTAL MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_messages (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,

    -- Message details
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(50) DEFAULT 'normal',

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    -- Sender info
    sender_type VARCHAR(50),
    sender_id INTEGER,
    sender_name VARCHAR(255),

    -- Related entities
    related_entity_type VARCHAR(100),
    related_entity_id INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_messages_client ON client_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_read ON client_messages(is_read);

-- =====================================================
-- CLIENT SESSIONS TABLE (for session management)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_sessions (
    id SERIAL PRIMARY KEY,
    client_user_id INTEGER REFERENCES client_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,

    -- Session details
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),

    -- Expiration
    expires_at TIMESTAMP NOT NULL,

    -- Tracking
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_sessions_user ON client_sessions(client_user_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_client_sessions_expires ON client_sessions(expires_at);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Client portal tables created successfully!';
END $$;
