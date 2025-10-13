import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  try {
    // Client access by auth code (no auth required) - GET
    if (req.method === 'GET' && req.query.auth_code) {
      const { auth_code } = req.query;
      const docs = await sql`
        SELECT ad.*, c.name as client_name
        FROM assigned_documents ad
        JOIN clients c ON ad.client_id = c.id
        WHERE ad.auth_code = ${auth_code}
        ORDER BY ad.id
      `;
      return res.json(docs);
    }
    
    // Client document submission (no auth required) - PUT
    if (req.method === 'PUT' && req.body.signature && !req.body.clinician_signature) {
      const { id, responses, signature, status } = req.body;
      const result = await sql`
        UPDATE assigned_documents 
        SET responses = ${JSON.stringify(responses)}, signature = ${signature}, 
            status = ${status}, completed_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return res.json(result[0]);
    }
    
    // All other operations require clinician authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const user = jwt.verify(token, JWT_SECRET);
    
    // Clinician viewing all documents - GET
    if (req.method === 'GET') {
      const docs = await sql`
        SELECT ad.*, c.name as client_name
        FROM assigned_documents ad
        JOIN clients c ON ad.client_id = c.id
        ORDER BY ad.id DESC
      `;
      return res.json(docs);
    }
    
    // Clinician assigning document - POST
    if (req.method === 'POST') {
      const { client_id, template_id, template_name, auth_code } = req.body;
      const result = await sql`
        INSERT INTO assigned_documents (client_id, template_id, template_name, auth_code, assigned_by, status)
        VALUES (${client_id}, ${template_id}, ${template_name}, ${auth_code}, ${user.username}, 'pending')
        RETURNING *
      `;
      return res.json(result[0]);
    }
    
    // Clinician co-signing document - PUT
    if (req.method === 'PUT' && req.body.clinician_signature) {
      const { id, clinician_signature } = req.body;
      const result = await sql`
        UPDATE assigned_documents 
        SET clinician_signature = ${clinician_signature}, clinician_signature_date = NOW()
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
