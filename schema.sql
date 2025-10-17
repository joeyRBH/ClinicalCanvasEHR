-- ClinicalSpeak EHR Database Schema
-- Execute this in your Neon PostgreSQL database

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    dob DATE,
    notes TEXT,
    stripe_customer_id VARCHAR(255),
    autopay_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (clinicians)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'clinician',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    type VARCHAR(255),
    cpt_code VARCHAR(10),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    due_date DATE NOT NULL,
    notes TEXT,
    services JSONB,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue
    payment_date DATE,
    stripe_payment_intent_id VARCHAR(255),
    autopay_attempted BOOLEAN DEFAULT false,
    autopay_result TEXT,
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    thrizer_claim_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document templates table
CREATE TABLE IF NOT EXISTS document_templates (
    id SERIAL PRIMARY KEY,
    template_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    fields JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assigned documents table
CREATE TABLE IF NOT EXISTS assigned_documents (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    template_id VARCHAR(100) NOT NULL,
    auth_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    responses JSONB,
    client_signature TEXT,
    clinician_signature TEXT
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table (STORES ONLY STRIPE REFERENCES, NEVER CARD DATA)
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- card, bank_account
    last4 VARCHAR(4),
    brand VARCHAR(50), -- visa, mastercard, amex, etc.
    expiry_month INTEGER,
    expiry_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    is_autopay_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    stripe_charge_id VARCHAR(255),
    payment_method_id INTEGER REFERENCES payment_methods(id),
    status VARCHAR(50) NOT NULL, -- succeeded, failed, refunded
    type VARCHAR(50) NOT NULL, -- payment, refund
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_assigned_docs_client ON assigned_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_assigned_docs_auth ON assigned_documents(auth_code);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_payment_methods_client ON payment_methods(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_customer ON payment_methods(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_client ON payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at);


