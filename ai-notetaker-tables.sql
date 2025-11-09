-- AI NoteTaker Database Tables
-- Run this SQL in your Crunchy Bridge database console

-- Create clinical_notes table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clinical_notes_client ON clinical_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_session_date ON clinical_notes(session_date);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created_by ON clinical_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_signed ON clinical_notes(is_signed);

-- Create note_audit_log table
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

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_note_audit_log_note ON note_audit_log(note_id);
CREATE INDEX IF NOT EXISTS idx_note_audit_log_action ON note_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_note_audit_log_user ON note_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_note_audit_log_created ON note_audit_log(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_clinical_notes_updated_at
BEFORE UPDATE ON clinical_notes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add AI consent columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_consent_signed BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_consent_signed_at TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_consent_signature_data TEXT;
