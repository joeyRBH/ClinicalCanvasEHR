import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Simple in-memory storage for demo mode
let demoInvoices = [];
let nextId = 1;
let nextInvoiceNum = 1001;

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
      const { client_id, status } = req.query;
      
      if (useDemo) {
        let result = demoInvoices;
        if (client_id) {
          result = result.filter(i => i.client_id == client_id);
        }
        if (status) {
          result = result.filter(i => i.status === status);
        }
        return res.json(result);
      }
      
      try {
        let invoices;
        if (client_id && status) {
          invoices = await sql`
            SELECT i.*, c.name as client_name, c.email, c.phone 
            FROM invoices i 
            LEFT JOIN clients c ON i.client_id = c.id 
            WHERE i.client_id = ${client_id} AND i.status = ${status}
            ORDER BY i.created_at DESC
          `;
        } else if (client_id) {
          invoices = await sql`
            SELECT i.*, c.name as client_name, c.email, c.phone 
            FROM invoices i 
            LEFT JOIN clients c ON i.client_id = c.id 
            WHERE i.client_id = ${client_id}
            ORDER BY i.created_at DESC
          `;
        } else if (status) {
          invoices = await sql`
            SELECT i.*, c.name as client_name, c.email, c.phone 
            FROM invoices i 
            LEFT JOIN clients c ON i.client_id = c.id 
            WHERE i.status = ${status}
            ORDER BY i.created_at DESC
          `;
        } else {
          invoices = await sql`
            SELECT i.*, c.name as client_name, c.email, c.phone 
            FROM invoices i 
            LEFT JOIN clients c ON i.client_id = c.id 
            ORDER BY i.created_at DESC
            LIMIT 100
          `;
        }
        return res.json(invoices);
      } catch (e) {
        return res.json(demoInvoices);
      }
    }
    
    if (req.method === 'POST') {
      const { client_id, due_date, notes, services, total_amount } = req.body;
      
      if (!client_id || !services || !total_amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const invoice_number = `INV-${nextInvoiceNum++}`;
      
      if (useDemo) {
        const newInvoice = {
          id: nextId++,
          client_id,
          invoice_number,
          due_date,
          notes: notes || null,
          services: typeof services === 'string' ? services : JSON.stringify(services),
          total_amount,
          status: 'pending',
          payment_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        demoInvoices.push(newInvoice);
        return res.json(newInvoice);
      }
      
      try {
        const result = await sql`
          INSERT INTO invoices (
            client_id, invoice_number, due_date, notes, services, total_amount, status, created_at, updated_at
          ) VALUES (
            ${client_id}, ${invoice_number}, ${due_date}, ${notes || null}, 
            ${JSON.stringify(services)}, ${total_amount}, 'pending', NOW(), NOW()
          )
          RETURNING *
        `;
        return res.json(result[0]);
      } catch (e) {
        const newInvoice = {
          id: nextId++,
          client_id,
          invoice_number,
          due_date,
          notes,
          services: typeof services === 'string' ? services : JSON.stringify(services),
          total_amount,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        demoInvoices.push(newInvoice);
        return res.json(newInvoice);
      }
    }
    
    if (req.method === 'PUT') {
      const { id, status, payment_date, notes } = req.body;
      
      if (useDemo) {
        const index = demoInvoices.findIndex(i => i.id == id);
        if (index !== -1) {
          if (status) demoInvoices[index].status = status;
          if (payment_date) demoInvoices[index].payment_date = payment_date;
          if (notes) demoInvoices[index].notes = notes;
          demoInvoices[index].updated_at = new Date().toISOString();
          return res.json(demoInvoices[index]);
        }
        return res.status(404).json({ error: 'Invoice not found' });
      }
      
      try {
        const result = await sql`
          UPDATE invoices 
          SET status = ${status || 'pending'}, 
              payment_date = ${payment_date || null}, 
              notes = ${notes || null},
              updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
        if (result.length === 0) {
          return res.status(404).json({ error: 'Invoice not found' });
        }
        return res.json(result[0]);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Invoices API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
