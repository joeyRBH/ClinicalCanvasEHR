import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      // Create appointments table
      await sql`
        CREATE TABLE IF NOT EXISTS appointments (
          id SERIAL PRIMARY KEY,
          client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
          appointment_date DATE NOT NULL,
          appointment_time TIME NOT NULL,
          duration INTEGER DEFAULT 60, -- minutes
          type VARCHAR(100) NOT NULL,
          cpt_code VARCHAR(10),
          notes TEXT,
          status VARCHAR(20) DEFAULT 'scheduled',
          created_by VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      // Create invoices table
      await sql`
        CREATE TABLE IF NOT EXISTS invoices (
          id SERIAL PRIMARY KEY,
          client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          services JSONB NOT NULL, -- Array of service objects
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
      
      // Create notifications table
      await sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL, -- 'appointment', 'document', 'invoice', 'system'
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          data JSONB, -- Additional data for the notification
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      // Create indexes for better performance
      await sql`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`;
      
      return res.json({ 
        success: true, 
        message: 'Database tables created successfully',
        tables: ['appointments', 'invoices', 'notifications']
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
