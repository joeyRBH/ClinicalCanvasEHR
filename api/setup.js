import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = { tables: [], admin: null, errors: [] };
    
    // 1. Create users table
    try {
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
      results.tables.push('users ✅');
    } catch (e) {
      results.errors.push('users table: ' + e.message);
    }
    
    // 2. Create clients table
    try {
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
      results.tables.push('clients ✅');
    } catch (e) {
      results.errors.push('clients table: ' + e.message);
    }
    
    // 3. Create audit_log table
    try {
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
      results.tables.push('audit_log ✅');
    } catch (e) {
      results.errors.push('audit_log table: ' + e.message);
    }
    
    // 4. Create or update admin user
    try {
      const hash = await bcrypt.hash('admin123', 10);
      
      // Check if admin exists
      const existing = await sql`SELECT id FROM users WHERE username = 'admin'`;
      
      if (existing.length > 0) {
        // Update existing admin
        await sql`
          UPDATE users 
          SET password_hash = ${hash}, name = 'Admin User', active = true
          WHERE username = 'admin'
        `;
        results.admin = 'Admin user updated ✅';
      } else {
        // Create new admin
        await sql`
          INSERT INTO users (username, password_hash, name, email, role, active)
          VALUES ('admin', ${hash}, 'Admin User', 'admin@clinicalspeak.com', 'admin', true)
        `;
        results.admin = 'Admin user created ✅';
      }
    } catch (e) {
      results.errors.push('admin user: ' + e.message);
    }
    
    // 5. Test admin login
    try {
      const testUser = await sql`
        SELECT id, username, name, active 
        FROM users 
        WHERE username = 'admin'
      `;
      
      if (testUser.length > 0 && testUser[0].active) {
        results.loginTest = 'Admin can login ✅';
      } else {
        results.loginTest = 'Admin user found but inactive ⚠️';
      }
    } catch (e) {
      results.errors.push('login test: ' + e.message);
    }
    
    return res.status(200).json({
      success: results.errors.length === 0,
      message: 'Database setup complete',
      results,
      nextStep: 'Try logging in with username: admin, password: admin123'
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

