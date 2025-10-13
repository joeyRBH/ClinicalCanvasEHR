import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) throw new Error('No token');
  return jwt.verify(token, JWT_SECRET);
}

export default async function handler(req, res) {
  try {
    const user = authenticate(req);
    
    if (req.method === 'GET') {
      const { client_id, status } = req.query;
      let query = sql`SELECT i.*, c.name as client_name, c.email, c.phone 
                     FROM invoices i 
                     JOIN clients c ON i.client_id = c.id 
                     ORDER BY i.created_at DESC`;
      
      if (client_id) {
        query = sql`SELECT i.*, c.name as client_name, c.email, c.phone 
                   FROM invoices i 
                   JOIN clients c ON i.client_id = c.id 
                   WHERE i.client_id = ${client_id}
                   ORDER BY i.created_at DESC`;
      }
      
      if (status) {
        query = sql`SELECT i.*, c.name as client_name, c.email, c.phone 
                   FROM invoices i 
                   JOIN clients c ON i.client_id = c.id 
                   WHERE i.status = ${status}
                   ORDER BY i.created_at DESC`;
      }
      
      const invoices = await query;
      return res.json(invoices);
    }
    
    if (req.method === 'POST') {
      const { client_id, services, total_amount, due_date, notes } = req.body;
      const invoice_number = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const result = await sql`
        INSERT INTO invoices (client_id, invoice_number, services, total_amount, due_date, notes, status, created_by)
        VALUES (${client_id}, ${invoice_number}, ${JSON.stringify(services)}, ${total_amount}, ${due_date}, ${notes}, 'pending', ${user.username})
        RETURNING *
      `;
      return res.json(result[0]);
    }
    
    if (req.method === 'PUT') {
      const { id, status, payment_date, payment_method, notes } = req.body;
      const result = await sql`
        UPDATE invoices 
        SET status = ${status}, payment_date = ${payment_date}, 
            payment_method = ${payment_method}, notes = ${notes}
        WHERE id = ${id}
        RETURNING *
      `;
      return res.json(result[0]);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
