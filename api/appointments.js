import { neon } from '@neondatabase/serverless';

// Initialize SQL client only if DATABASE_URL is available
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Simple in-memory storage for demo mode
let demoAppointments = [];
let nextId = 1;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const useDemo = !process.env.DATABASE_URL;
    
    if (req.method === 'GET') {
      const { month, year, client_id } = req.query;
      
      if (useDemo) {
        let result = demoAppointments;
        if (client_id) {
          result = result.filter(a => a.client_id == client_id);
        }
        return res.json(result);
      }
      
      try {
        let appointments;
        if (month && year) {
          appointments = await sql`
            SELECT a.*, c.name as client_name, c.phone, c.email 
            FROM appointments a 
            LEFT JOIN clients c ON a.client_id = c.id 
            WHERE EXTRACT(MONTH FROM a.appointment_date) = ${month} 
            AND EXTRACT(YEAR FROM a.appointment_date) = ${year}
            ORDER BY a.appointment_date, a.appointment_time
          `;
        } else if (client_id) {
          appointments = await sql`
            SELECT a.*, c.name as client_name, c.phone, c.email 
            FROM appointments a 
            LEFT JOIN clients c ON a.client_id = c.id 
            WHERE a.client_id = ${client_id}
            ORDER BY a.appointment_date DESC
          `;
        } else {
          appointments = await sql`
            SELECT a.*, c.name as client_name, c.phone, c.email 
            FROM appointments a 
            LEFT JOIN clients c ON a.client_id = c.id 
            ORDER BY a.appointment_date DESC
            LIMIT 100
          `;
        }
        return res.json(appointments);
      } catch (e) {
        return res.json(demoAppointments);
      }
    }
    
    if (req.method === 'POST') {
      const { client_id, appointment_date, appointment_time, duration, type, notes, cpt_code } = req.body;
      
      if (!client_id || !appointment_date || !appointment_time || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      if (useDemo) {
        const newApt = {
          id: nextId++,
          client_id,
          appointment_date,
          appointment_time,
          duration: duration || 60,
          type,
          cpt_code: cpt_code || null,
          notes: notes || null,
          status: 'scheduled',
          created_at: new Date().toISOString()
        };
        demoAppointments.push(newApt);
        return res.json(newApt);
      }
      
      try {
        const result = await sql`
          INSERT INTO appointments (
            client_id, appointment_date, appointment_time, duration, type, notes, cpt_code, status, created_by, created_at
          ) VALUES (
            ${client_id}, ${appointment_date}, ${appointment_time}, ${duration || 60}, 
            ${type}, ${notes || null}, ${cpt_code || null}, 'scheduled', 'admin', NOW()
          )
          RETURNING *
        `;
        return res.json(result[0]);
      } catch (e) {
        const newApt = {
          id: nextId++,
          client_id,
          appointment_date,
          appointment_time,
          duration: duration || 60,
          type,
          notes,
          cpt_code,
          status: 'scheduled',
          created_at: new Date().toISOString()
        };
        demoAppointments.push(newApt);
        return res.json(newApt);
      }
    }
    
    if (req.method === 'PUT') {
      const { id, appointment_date, appointment_time, duration, type, notes, cpt_code, status } = req.body;
      
      if (useDemo) {
        const index = demoAppointments.findIndex(a => a.id == id);
        if (index !== -1) {
          demoAppointments[index] = {
            ...demoAppointments[index],
            appointment_date, appointment_time, duration, type, notes, cpt_code,
            status: status || 'scheduled'
          };
          return res.json(demoAppointments[index]);
        }
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      try {
        const result = await sql`
          UPDATE appointments 
          SET appointment_date = ${appointment_date}, appointment_time = ${appointment_time},
              duration = ${duration}, type = ${type}, notes = ${notes}, 
              cpt_code = ${cpt_code}, status = ${status || 'scheduled'}
          WHERE id = ${id}
          RETURNING *
        `;
        return res.json(result[0]);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      
      if (useDemo) {
        demoAppointments = demoAppointments.filter(a => a.id != id);
        return res.json({ success: true });
      }
      
      try {
        await sql`DELETE FROM appointments WHERE id = ${id}`;
        return res.json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Appointments API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
