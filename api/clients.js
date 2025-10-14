import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Simple in-memory storage for demo mode
let demoClients = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '555-0123', dob: '1990-01-15', notes: 'Demo client', active: true }
];
let nextId = 2;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Try database first, fall back to demo mode
    const useDemo = !process.env.DATABASE_URL;
    
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (useDemo) {
        const result = id ? demoClients.filter(c => c.id == id) : demoClients.filter(c => c.active);
        return res.json(result);
      }
      
      try {
        const clients = id 
          ? await sql`SELECT * FROM clients WHERE id = ${id} AND active = true`
          : await sql`SELECT * FROM clients WHERE active = true ORDER BY name`;
        return res.json(clients);
      } catch (e) {
        return res.json(demoClients.filter(c => c.active));
      }
    }
    
    if (req.method === 'POST') {
      const { name, email, phone, dob, notes } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      if (useDemo) {
        const newClient = {
          id: nextId++,
          name,
          email: email || null,
          phone: phone || null,
          dob: dob || null,
          notes: notes || null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        demoClients.push(newClient);
        return res.json(newClient);
      }
      
      try {
        const result = await sql`
          INSERT INTO clients (name, email, phone, dob, notes, active, created_at, updated_at)
          VALUES (${name}, ${email || null}, ${phone || null}, ${dob || null}, ${notes || null}, true, NOW(), NOW())
          RETURNING *
        `;
        return res.json(result[0]);
      } catch (e) {
        const newClient = {
          id: nextId++,
          name,
          email: email || null,
          phone: phone || null,
          dob: dob || null,
          notes: notes || null,
          active: true
        };
        demoClients.push(newClient);
        return res.json(newClient);
      }
    }
    
    if (req.method === 'PUT') {
      const { id, name, email, phone, dob, notes } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({ error: 'ID and name are required' });
      }
      
      if (useDemo) {
        const index = demoClients.findIndex(c => c.id == id);
        if (index !== -1) {
          demoClients[index] = { ...demoClients[index], name, email, phone, dob, notes, updated_at: new Date().toISOString() };
          return res.json(demoClients[index]);
        }
        return res.status(404).json({ error: 'Client not found' });
      }
      
      try {
        const result = await sql`
          UPDATE clients 
          SET name = ${name}, email = ${email || null}, phone = ${phone || null}, 
              dob = ${dob || null}, notes = ${notes || null}, updated_at = NOW()
          WHERE id = ${id} AND active = true
          RETURNING *
        `;
        if (result.length === 0) {
          return res.status(404).json({ error: 'Client not found' });
        }
        return res.json(result[0]);
      } catch (e) {
        const index = demoClients.findIndex(c => c.id == id);
        if (index !== -1) {
          demoClients[index] = { ...demoClients[index], name, email, phone, dob, notes };
          return res.json(demoClients[index]);
        }
        return res.status(404).json({ error: 'Client not found' });
      }
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      
      if (useDemo) {
        const index = demoClients.findIndex(c => c.id == id);
        if (index !== -1) {
          demoClients[index].active = false;
          return res.json({ success: true, id });
        }
        return res.status(404).json({ error: 'Client not found' });
      }
      
      try {
        await sql`UPDATE clients SET active = false WHERE id = ${id}`;
        return res.json({ success: true, id });
      } catch (e) {
        const index = demoClients.findIndex(c => c.id == id);
        if (index !== -1) {
          demoClients[index].active = false;
          return res.json({ success: true, id });
        }
        return res.status(404).json({ error: 'Client not found' });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Clients API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
