// Add these endpoints to your existing api/index.js file
// Insert after the existing routes (around line 350)

// ==================== ASSIGNED DOCUMENTS ROUTES ====================

// GET /api/assigned-docs - Get assigned documents
app.get('/api/assigned-docs', async (req, res) => {
  try {
    const { client_id, auth_code } = req.query;
    
    let result;
    
    // If auth code is provided (client portal access)
    if (auth_code) {
      result = await sql`
        SELECT ad.*, c.name as client_name
        FROM assigned_documents ad
        LEFT JOIN clients c ON ad.client_id = c.id
        WHERE ad.auth_code = ${auth_code.toUpperCase()}
        ORDER BY ad.assigned_at DESC
      `;
    }
    // If authenticated user with optional client filter
    else if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const verified = jwt.verify(token, JWT_SECRET);
      
      if (client_id) {
        result = await sql`
          SELECT ad.*, c.name as client_name
          FROM assigned_documents ad
          LEFT JOIN clients c ON ad.client_id = c.id
          WHERE ad.client_id = ${client_id}
          ORDER BY ad.assigned_at DESC
        `;
      } else {
        result = await sql`
          SELECT ad.*, c.name as client_name
          FROM assigned_documents ad
          LEFT JOIN clients c ON ad.client_id = c.id
          ORDER BY ad.assigned_at DESC
        `;
      }
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get assigned docs error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned documents' });
  }
});

// POST /api/assigned-docs - Assign document to client
app.post('/api/assigned-docs', authenticateToken, async (req, res) => {
  try {
    const { client_id, template_id, template_name, auth_code } = req.body;
    
    // Get client info
    const clientResult = await sql`
      SELECT name FROM clients WHERE id = ${client_id}
    `;
    
    if (clientResult.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const result = await sql`
      INSERT INTO assigned_documents (
        client_id, 
        client_name,
        template_id, 
        template_name, 
        assigned_by,
        auth_code,
        status
      )
      VALUES (
        ${client_id},
        ${clientResult[0].name},
        ${template_id}, 
        ${template_name},
        ${req.user.name || 'Unknown'},
        ${auth_code},
        'pending'
      )
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create assigned doc error:', error);
    res.status(500).json({ error: 'Failed to assign document' });
  }
});

// PUT /api/assigned-docs/:id - Update document (completion/signature)
app.put('/api/assigned-docs/:id', async (req, res) => {
  try {
    const { responses, signature, status, clinician_signature } = req.body;
    
    // Build update object
    const updates = {};
    if (responses !== undefined) updates.responses = JSON.stringify(responses);
    if (signature !== undefined) updates.signature = signature;
    if (status !== undefined) updates.status = status;
    if (clinician_signature !== undefined) {
      updates.clinician_signature = clinician_signature;
      updates.clinician_signature_date = new Date().toISOString();
      updates.clinician_reviewed_at = new Date().toISOString();
    }
    
    // If being completed, add completion timestamp
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    const result = await sql`
      UPDATE assigned_documents
      SET 
        responses = ${updates.responses || sql`responses`},
        signature = ${updates.signature || sql`signature`},
        status = ${updates.status || sql`status`},
        completed_at = ${updates.completed_at || sql`completed_at`},
        clinician_signature = ${updates.clinician_signature || sql`clinician_signature`},
        clinician_signature_date = ${updates.clinician_signature_date || sql`clinician_signature_date`},
        clinician_reviewed_at = ${updates.clinician_reviewed_at || sql`clinician_reviewed_at`}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Update assigned doc error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// ==================== AUDIT LOG ROUTES ====================

// POST /api/audit - Create audit log entry
app.post('/api/audit', authenticateToken, async (req, res) => {
  try {
    const { action, details } = req.body;
    
    const result = await sql`
      INSERT INTO audit_log (
        user_id, 
        user_name, 
        action, 
        details, 
        ip_address
      )
      VALUES (
        ${req.user.id},
        ${req.user.name || 'Unknown'},
        ${action},
        ${JSON.stringify(details)},
        ${req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'}
      )
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// GET /api/audit - Get audit logs
app.get('/api/audit', authenticateToken, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const result = await sql`
      SELECT * FROM audit_log
      ORDER BY timestamp DESC
      LIMIT ${parseInt(limit)}
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});
