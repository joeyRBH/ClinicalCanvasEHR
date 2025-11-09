// Add AI NoteTaker Tables to Existing Database
// This endpoint adds clinical_notes and note_audit_log tables

const AI_NOTETAKER_SQL = `
-- AI CLINICAL NOTETAKER TABLES
CREATE TABLE IF NOT EXISTS clinical_notes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    session_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_type VARCHAR(50) DEFAULT 'individual',
    note_format VARCHAR(50) NOT NULL,
    transcript TEXT,
    clinical_note TEXT NOT NULL,
    audio_file_url VARCHAR(500),
    duration_seconds INTEGER,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_signed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMP,
    signed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    signature_data TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_at TIMESTAMP,
    locked_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_client ON clinical_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_session_date ON clinical_notes(session_date);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created_by ON clinical_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_signed ON clinical_notes(is_signed);

CREATE TABLE IF NOT EXISTS note_audit_log (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES clinical_notes(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_type VARCHAR(50),
    user_name VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    changes JSONB,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_audit_log_note ON note_audit_log(note_id);
CREATE INDEX IF NOT EXISTS idx_note_audit_log_action ON note_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_note_audit_log_user ON note_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_note_audit_log_created ON note_audit_log(created_at);

-- Trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_clinical_notes_updated_at'
    ) THEN
        CREATE TRIGGER update_clinical_notes_updated_at
        BEFORE UPDATE ON clinical_notes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add AI consent columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_consent_signed BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_consent_signed_at TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_consent_signature_data TEXT;
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
        message: 'Database connection not configured'
      });
    }

    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30
    });

    // Execute the SQL
    await sql.unsafe(AI_NOTETAKER_SQL);

    // Check if tables were created
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('clinical_notes', 'note_audit_log')
      ORDER BY tablename
    `;

    await sql.end();

    return res.status(200).json({
      success: true,
      message: '✅ AI NoteTaker tables created successfully!',
      tables: tables.map(t => t.tablename),
      nextSteps: [
        '✅ clinical_notes table ready',
        '✅ note_audit_log table ready',
        '✅ AI consent columns added to clients',
        '🎉 You can now save clinical notes!'
      ]
    });

  } catch (error) {
    console.error('AI NoteTaker setup error:', error);

    return res.status(500).json({
      success: false,
      error: 'Setup failed',
      message: error.message,
      detail: error.detail || 'No additional details'
    });
  }
}
