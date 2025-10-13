import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { action, details, user_name } = req.body;
      await sql`
        INSERT INTO audit_log (action, details, user_name)
        VALUES (${action}, ${JSON.stringify(details)}, ${user_name})
      `;
      return res.json({ success: true });
    }
    
    if (req.method === 'GET') {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token' });
      
      jwt.verify(token, JWT_SECRET);
      
      const logs = await sql`
        SELECT * FROM audit_log 
        ORDER BY timestamp DESC 
        LIMIT 100
      `;
      return res.json(logs);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
