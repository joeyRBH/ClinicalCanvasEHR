import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

// Initialize SQL client only if DATABASE_URL is available
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if database is configured
  if (!process.env.DATABASE_URL) {
    return res.status(400).json({
      success: false,
      error: 'DATABASE_URL not configured. App is running in demo mode.',
      message: 'To use database features, add DATABASE_URL to environment variables'
    });
  }

  try {
    const results = { tables: [], admin: null, errors: [] };
    
    // Create tables using the full schema from schema.sql
    try {
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
      results.tables.push('users ✅');
      
      // Create admin user
      const hash = await bcrypt.hash('admin123', 10);
      const existing = await sql`SELECT id FROM users WHERE username = 'admin'`;
      
      if (existing.length > 0) {
        await sql`UPDATE users SET password_hash = ${hash}, name = 'Admin User', active = true WHERE username = 'admin'`;
        results.admin = 'Admin user updated ✅';
      } else {
        await sql`INSERT INTO users (username, password_hash, name, email, role, active) VALUES ('admin', ${hash}, 'Admin User', 'admin@clinicalspeak.com', 'admin', true)`;
        results.admin = 'Admin user created ✅';
      }
      
      return res.status(200).json({
        success: true,
        message: 'Database setup complete',
        results,
        nextStep: 'Login with username: admin, password: admin123'
      });
      
    } catch (e) {
      results.errors.push(e.message);
      return res.status(500).json({
        success: false,
        error: 'Database setup failed',
        details: results
      });
    }
    
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
