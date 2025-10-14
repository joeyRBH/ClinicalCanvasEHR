/**
 * Database Configuration and Utilities
 * Centralized database connection with error handling
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

/**
 * Create database connection
 */
export const sql = neon(DATABASE_URL);

/**
 * Execute query with error handling
 */
export async function executeQuery(query, errorMessage = 'Database query failed') {
  try {
    return await query;
  } catch (error) {
    console.error('Database error:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    throw error;
  }
}

/**
 * Transaction helper (for future use with transaction support)
 */
export async function withTransaction(callback) {
  // Note: Neon serverless doesn't support traditional transactions
  // This is a placeholder for future implementation
  try {
    return await callback(sql);
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

/**
 * Initialize all database tables
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(20) DEFAULT 'clinician',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Clients table
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        dob DATE,
        notes TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Appointments table
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        duration INTEGER DEFAULT 60,
        type VARCHAR(100) NOT NULL,
        cpt_code VARCHAR(10),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'scheduled',
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Invoices table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        services JSONB NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        due_date DATE,
        payment_date DATE,
        payment_method VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Assigned documents table
    await sql`
      CREATE TABLE IF NOT EXISTS assigned_documents (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        template_id VARCHAR(50) NOT NULL,
        template_name VARCHAR(255) NOT NULL,
        auth_code VARCHAR(20) UNIQUE NOT NULL,
        form_data JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        client_signature TEXT,
        client_signature_date TIMESTAMP,
        clinician_signature TEXT,
        clinician_signature_date TIMESTAMP,
        assigned_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Audit log table (HIPAA compliance)
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        resource VARCHAR(50) NOT NULL,
        resource_id VARCHAR(50),
        action VARCHAR(20) NOT NULL,
        ip_address VARCHAR(50),
        user_agent TEXT,
        details JSONB,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assigned_docs_client ON assigned_documents(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assigned_docs_auth_code ON assigned_documents(auth_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC)`;
    
    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth() {
  try {
    const result = await sql`SELECT NOW() as current_time, version() as version`;
    return {
      healthy: true,
      timestamp: result[0].current_time,
      version: result[0].version
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const stats = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM clients`,
      sql`SELECT COUNT(*) as count FROM appointments`,
      sql`SELECT COUNT(*) as count FROM invoices`,
      sql`SELECT COUNT(*) as count FROM assigned_documents`,
      sql`SELECT COUNT(*) as count FROM audit_log`
    ]);
    
    return {
      users: parseInt(stats[0][0].count),
      clients: parseInt(stats[1][0].count),
      appointments: parseInt(stats[2][0].count),
      invoices: parseInt(stats[3][0].count),
      documents: parseInt(stats[4][0].count),
      auditLogs: parseInt(stats[5][0].count)
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
}

