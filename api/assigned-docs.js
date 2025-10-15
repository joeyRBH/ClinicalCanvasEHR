// Pure Node.js API - No external dependencies
// HIPAA-compliant document management

let demoAssignedDocs = [
  {
    id: 1,
    client_id: 1,
    client_name: 'John Doe',
    template_id: 'informed_consent',
    template_name: 'Informed Consent',
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

function logAudit(action, details = {}) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}:`, details);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    logAudit('assigned_docs_api_access', { method: req.method, url: req.url });

    if (req.method === 'GET') {
      const { auth_code, client_id } = req.query;
      
      let results = demoAssignedDocs;
      
      if (auth_code) {
        results = results.filter(d => d.auth_code === auth_code);
      }
      
      if (client_id) {
        results = results.filter(d => d.client_id == client_id);
      }
      
      return res.json(results);
    }
    
    if (req.method === 'POST') {
      const { client_id, client_name, template_id, template_name, auth_code } = req.body;
      
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
      
      demoAssignedDocs.push(newDoc);
      logAudit('document_assigned', { id: newDoc.id, client_id: newDoc.client_id, auth_code });
      return res.json(newDoc);
    }
    
    if (req.method === 'PUT') {
      const { id, form_data, status, client_signature, clinician_signature } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      
      const index = demoAssignedDocs.findIndex(d => d.id == id);
      if (index === -1) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
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
      
      logAudit('document_updated', { id, status });
      return res.json(demoAssignedDocs[index]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    logAudit('assigned_docs_api_error', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
};