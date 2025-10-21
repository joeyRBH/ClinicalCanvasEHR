// Assigned Documents API Endpoint
// Manages document assignments with database integration

const { initDatabase, executeQuery, isDatabaseConnected } = require('./utils/database-connection');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize database connection
    const dbConnected = await initDatabase();

    // GET: Retrieve assigned documents
    if (req.method === 'GET') {
      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Demo mode - no database connection'
        });
      }

      const { id, client_id, auth_code, status } = req.query;

      if (id) {
        // Get single document
        const result = await executeQuery(
          `SELECT ad.*, c.name as client_name 
           FROM assigned_documents ad
           LEFT JOIN clients c ON ad.client_id = c.id
           WHERE ad.id = $1`,
          [id]
        );

        if (result.data.length === 0) {
          return res.status(404).json({ error: 'Document not found' });
        }

        // Parse responses JSON
        const doc = result.data[0];
        doc.responses = doc.responses ? 
          (typeof doc.responses === 'string' ? JSON.parse(doc.responses) : doc.responses) 
          : {};

        return res.status(200).json({
          success: true,
          data: doc,
          message: 'Document retrieved successfully'
        });
      } else if (auth_code) {
        // Get document by auth code
        const result = await executeQuery(
          `SELECT ad.*, c.name as client_name 
           FROM assigned_documents ad
           LEFT JOIN clients c ON ad.client_id = c.id
           WHERE ad.auth_code = $1`,
          [auth_code]
        );

        if (result.data.length === 0) {
          return res.status(404).json({ error: 'Document not found' });
        }

        const doc = result.data[0];
        doc.responses = doc.responses ? 
          (typeof doc.responses === 'string' ? JSON.parse(doc.responses) : doc.responses) 
          : {};

        return res.status(200).json({
          success: true,
          data: doc,
          message: 'Document retrieved successfully'
        });
      } else {
        // Build query
        let query = `SELECT ad.*, c.name as client_name 
                     FROM assigned_documents ad
                     LEFT JOIN clients c ON ad.client_id = c.id
                     WHERE 1=1`;
        const params = [];
        let paramCount = 1;

        if (client_id) {
          query += ` AND ad.client_id = $${paramCount++}`;
          params.push(client_id);
        }

        if (status) {
          query += ` AND ad.status = $${paramCount++}`;
          params.push(status);
        }

        query += ' ORDER BY ad.assigned_at DESC';

        const result = await executeQuery(query, params);

        // Parse responses JSON for all documents
        const docs = result.data.map(doc => ({
          ...doc,
          responses: doc.responses ? 
            (typeof doc.responses === 'string' ? JSON.parse(doc.responses) : doc.responses) 
            : {}
        }));

        return res.status(200).json({
          success: true,
          data: docs,
          message: 'Documents retrieved successfully'
        });
      }
    }

    // POST: Create assigned document
    if (req.method === 'POST') {
      const { client_id, template_id, auth_code, template_name } = req.body;

      if (!client_id || !template_id || !auth_code) {
        return res.status(400).json({ 
          error: 'client_id, template_id, and auth_code are required' 
        });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: {
            id: Date.now(),
            client_id,
            template_id,
            template_name,
            auth_code,
            status: 'pending',
            assigned_at: new Date().toISOString(),
            responses: {}
          },
          message: 'Demo mode - document assigned'
        });
      }

      const result = await executeQuery(
        `INSERT INTO assigned_documents (client_id, template_id, auth_code, status, assigned_at, responses)
         VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP, '{}')
         RETURNING *`,
        [client_id, template_id, auth_code]
      );

      const doc = result.data[0];
      doc.responses = {};

      return res.status(201).json({
        success: true,
        data: doc,
        message: 'Document assigned successfully'
      });
    }

    // PUT: Update assigned document
    if (req.method === 'PUT') {
      const { id, status, responses, client_signature, clinician_signature } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: { id, status, responses, client_signature, clinician_signature },
          message: 'Demo mode - document updated'
        });
      }

      // Build dynamic update query
      const updates = [];
      const params = [];
      let paramCount = 1;

      if (status) {
        updates.push(`status = $${paramCount++}`);
        params.push(status);
        
        if (status === 'completed') {
          updates.push(`completed_at = CURRENT_TIMESTAMP`);
        }
      }

      if (responses !== undefined) {
        updates.push(`responses = $${paramCount++}`);
        params.push(JSON.stringify(responses));
      }

      if (client_signature !== undefined) {
        updates.push(`client_signature = $${paramCount++}`);
        params.push(client_signature);
      }

      if (clinician_signature !== undefined) {
        updates.push(`clinician_signature = $${paramCount++}`);
        params.push(clinician_signature);
      }

      params.push(id);

      const query = `UPDATE assigned_documents 
                     SET ${updates.join(', ')}
                     WHERE id = $${paramCount}
                     RETURNING *`;

      const result = await executeQuery(query, params);

      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const doc = result.data[0];
      doc.responses = doc.responses ? 
        (typeof doc.responses === 'string' ? JSON.parse(doc.responses) : doc.responses) 
        : {};

      return res.status(200).json({
        success: true,
        data: doc,
        message: 'Document updated successfully'
      });
    }

    // DELETE: Delete assigned document
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          message: 'Demo mode - document deleted'
        });
      }

      const result = await executeQuery(
        'DELETE FROM assigned_documents WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Assigned Documents API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}



