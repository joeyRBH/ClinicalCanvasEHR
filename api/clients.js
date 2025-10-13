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
      const clients = await sql`SELECT * FROM clients ORDER BY name`;
      return res.json(clients);
    }
    
    if (req.method === 'POST') {
      const { name, email, phone, dob, notes } = req.body;
      const result = await sql`
        INSERT INTO clients (name, email, phone, dob, notes)
        VALUES (${name}, ${email}, ${phone}, ${dob}, ${notes})
        RETURNING *
      `;
      return res.json(result[0]);
    }
    
    if (req.method === 'PUT') {
      const { id, name, email, phone, dob, notes } = req.body;
      const result = await sql`
        UPDATE clients 
        SET name = ${name}, email = ${email}, phone = ${phone}, dob = ${dob}, notes = ${notes}
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
