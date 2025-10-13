import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  try {
    // Client access by auth code (no auth required)
    if (req.method === 'GET' && req.query.auth_code) {
      const { auth_code } = req.query;
      const docs = await sql`
        SELECT ad.*, c.name as client_name
        FROM assigned_documents ad
        JOIN clients c ON ad.client_id = c.id
        WHERE ad.auth_code = ${auth_code}
        ORDER BY ad.created_at
      `;
      return res.json(docs);
    }
    
    // Clinician access (requires auth)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const user = jwt.verify(token, JWT_SECRET);
    
    if (req.method === 'GET') {
      const docs = await sql`
        SELECT ad.*, c.name as client_name
        FROM assigned_documents ad
        JOIN clients c ON ad.client_id = c.id
        ORDER BY ad.created_at DESC
      `;
      return res.json(docs);
    }
    
    if (req.method === 'POST') {
      const { client_id, template_id, template_name, auth_code } = req.body;
      const result = await sql`
        INSERT INTO assigned_documents (client_id, template_id, template_name, auth_code, assigned_by, status)
        VALUES (${client_id}, ${template_id}, ${template_name}, ${auth_code}, ${user.username}, 'pending')
        RETURNING *
      `;
      return res.json(result[0]);
    }
    
    if (req.method === 'PUT') {
      const { id, responses, signature, status, clinician_signature } = req.body;
      
      if (clinician_signature) {
        const result = await sql`
          UPDATE assigned_documents 
          SET clinician_signature = ${clinician_signature}, clinician_signature_date = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
        return res.json(result[0]);
      } else {
        const result = await sql`
          UPDATE assigned_documents 
          SET responses = ${JSON.stringify(responses)}, signature = ${signature}, 
              status = ${status}, completed_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
        return res.json(result[0]);
      }
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
