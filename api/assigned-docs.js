import { neon } from '@neondatabase/serverless';

// Initialize SQL client only if DATABASE_URL is available
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Demo storage with sample data
let demoAssignedDocs = [
  {
    id: 1,
    client_id: 1,
    template_id: 'informed-consent',
    template_name: 'Informed Consent for Mental Health Services',
    auth_code: 'DEMO-123456',
    form_data: null,
    status: 'pending',
    client_signature: null,
    client_signature_date: null,
    clinician_signature: null,
    clinician_signature_date: null,
    assigned_by: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
let nextId = 2;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const useDemo = !process.env.DATABASE_URL;
    
    if (req.method === 'GET') {
      const { auth_code, client_id } = req.query;
      
      if (useDemo) {
        let results = demoAssignedDocs;
        if (auth_code) {
          results = results.filter(d => d.auth_code === auth_code);
        }
        if (client_id) {
          results = results.filter(d => d.client_id == client_id);
        }
        return res.json(results);
      }
      
      try {
        let docs;
        if (auth_code) {
          docs = await sql`
            SELECT ad.*, c.name as client_name 
            FROM assigned_documents ad
            LEFT JOIN clients c ON ad.client_id = c.id
            WHERE ad.auth_code = ${auth_code}
          `;
        } else if (client_id) {
          docs = await sql`
            SELECT ad.*, c.name as client_name 
            FROM assigned_documents ad
            LEFT JOIN clients c ON ad.client_id = c.id
            WHERE ad.client_id = ${client_id}
            ORDER BY ad.created_at DESC
          `;
        } else {
          docs = await sql`
            SELECT ad.*, c.name as client_name 
            FROM assigned_documents ad
            LEFT JOIN clients c ON ad.client_id = c.id
            ORDER BY ad.created_at DESC
            LIMIT 100
          `;
        }
        return res.json(docs);
      } catch (e) {
        return res.json(demoAssignedDocs);
      }
    }
    
    if (req.method === 'POST') {
      const { client_id, template_id, template_name, auth_code, client_name } = req.body;
      
      if (!client_id || !template_id || !template_name || !auth_code) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const newDoc = {
        id: nextId++,
        client_id,
        client_name: client_name || 'Unknown Client',
        template_id,
        template_name,
        auth_code,
        form_data: null,
        status: 'pending',
        client_signature: null,
        client_signature_date: null,
        clinician_signature: null,
        clinician_signature_date: null,
        assigned_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (useDemo) {
        demoAssignedDocs.push(newDoc);
        return res.json(newDoc);
      }
      
      try {
        const result = await sql`
          INSERT INTO assigned_documents (
            client_id, template_id, template_name, auth_code, status, assigned_by, created_at, updated_at
          ) VALUES (
            ${client_id}, ${template_id}, ${template_name}, ${auth_code}, 'pending', 'admin', NOW(), NOW()
          )
          RETURNING *
        `;
        return res.json(result[0]);
      } catch (e) {
        demoAssignedDocs.push(newDoc);
        return res.json(newDoc);
      }
    }
    
    if (req.method === 'PUT') {
      const { id, form_data, status, client_signature, clinician_signature } = req.body;
      
      if (useDemo) {
        const index = demoAssignedDocs.findIndex(d => d.id == id);
        if (index !== -1) {
          if (form_data) demoAssignedDocs[index].form_data = form_data;
          if (status) demoAssignedDocs[index].status = status;
          if (client_signature) {
            demoAssignedDocs[index].client_signature = client_signature;
            demoAssignedDocs[index].client_signature_date = new Date().toISOString();
          }
          if (clinician_signature) {
            demoAssignedDocs[index].clinician_signature = clinician_signature;
            demoAssignedDocs[index].clinician_signature_date = new Date().toISOString();
          }
          demoAssignedDocs[index].updated_at = new Date().toISOString();
          return res.json(demoAssignedDocs[index]);
        }
        return res.status(404).json({ error: 'Document not found' });
      }
      
      try {
        const result = await sql`
          UPDATE assigned_documents 
          SET 
            form_data = ${form_data || null},
            status = ${status || 'pending'},
            client_signature = ${client_signature || null},
            client_signature_date = ${client_signature ? sql`NOW()` : null},
            clinician_signature = ${clinician_signature || null},
            clinician_signature_date = ${clinician_signature ? sql`NOW()` : null},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
        return res.json(result[0]);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Assigned docs API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
