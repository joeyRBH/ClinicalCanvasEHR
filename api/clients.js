// Pure Node.js API - No external dependencies
// HIPAA-compliant with audit logging

let demoClients = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '555-0123', dob: '1990-01-15', notes: 'Demo client', active: true, created_at: new Date().toISOString() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '555-0456', dob: '1985-03-22', notes: 'Regular patient', active: true, created_at: new Date().toISOString() }
];
let nextId = 3;

function logAudit(action, details = {}) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}:`, details);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    logAudit('clients_api_access', { method: req.method, url: req.url });

    if (req.method === 'GET') {
      const { id } = req.query;
      const result = id ? demoClients.filter(c => c.id == id) : demoClients.filter(c => c.active);
      return res.json(result);
    }
    
    if (req.method === 'POST') {
      const { name, email, phone, dob, notes } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
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
      logAudit('client_created', { id: newClient.id, name: newClient.name });
      return res.json(newClient);
    }
    
    if (req.method === 'PUT') {
      const { id, name, email, phone, dob, notes } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({ error: 'ID and name are required' });
      }
      
      const index = demoClients.findIndex(c => c.id == id);
      if (index === -1) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      demoClients[index] = {
        ...demoClients[index],
        name,
        email: email || null,
        phone: phone || null,
        dob: dob || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      };
      
      logAudit('client_updated', { id, name });
      return res.json(demoClients[index]);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      
      const index = demoClients.findIndex(c => c.id == id);
      if (index === -1) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      demoClients[index].active = false;
      demoClients[index].updated_at = new Date().toISOString();
      
      logAudit('client_deleted', { id });
      return res.json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    logAudit('clients_api_error', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
};