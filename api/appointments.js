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
      const { month, year } = req.query;
      let query = sql`SELECT a.*, c.name as client_name, c.phone, c.email 
                     FROM appointments a 
                     JOIN clients c ON a.client_id = c.id 
                     ORDER BY a.appointment_date, a.appointment_time`;
      
      if (month && year) {
        query = sql`SELECT a.*, c.name as client_name, c.phone, c.email 
                   FROM appointments a 
                   JOIN clients c ON a.client_id = c.id 
                   WHERE EXTRACT(MONTH FROM a.appointment_date) = ${month} 
                   AND EXTRACT(YEAR FROM a.appointment_date) = ${year}
                   ORDER BY a.appointment_date, a.appointment_time`;
      }
      
      const appointments = await query;
      return res.json(appointments);
    }
    
    if (req.method === 'POST') {
      const { client_id, appointment_date, appointment_time, duration, type, notes, cpt_code } = req.body;
      const result = await sql`
        INSERT INTO appointments (client_id, appointment_date, appointment_time, duration, type, notes, cpt_code, created_by)
        VALUES (${client_id}, ${appointment_date}, ${appointment_time}, ${duration}, ${type}, ${notes}, ${cpt_code}, ${user.username})
        RETURNING *
      `;
      return res.json(result[0]);
    }
    
    if (req.method === 'PUT') {
      const { id, appointment_date, appointment_time, duration, type, notes, cpt_code, status } = req.body;
      const result = await sql`
        UPDATE appointments 
        SET appointment_date = ${appointment_date}, appointment_time = ${appointment_time}, 
            duration = ${duration}, type = ${type}, notes = ${notes}, 
            cpt_code = ${cpt_code}, status = ${status || 'scheduled'}
        WHERE id = ${id}
        RETURNING *
      `;
      return res.json(result[0]);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await sql`DELETE FROM appointments WHERE id = ${id}`;
      return res.json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
