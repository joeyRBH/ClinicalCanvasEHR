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

      const { id, client_id, auth_code, access_code, status } = req.query;

      // Support both auth_code (legacy) and access_code (schema-correct)
      const code = access_code || auth_code;

      if (id) {
        // Get single document
        const result = await executeQuery(
          `SELECT ad.*, c.name as client_name, d.title as document_title
           FROM assigned_documents ad
           LEFT JOIN clients c ON ad.client_id = c.id
           LEFT JOIN documents d ON ad.document_id = d.id
           WHERE ad.id = $1`,
          [id]
        );

        if (result.data.length === 0) {
          return res.status(404).json({ error: 'Document not found' });
        }

        const doc = result.data[0];
        // Return both field names for compatibility
        doc.auth_code = doc.access_code;
        doc.template_name = doc.document_title;

        return res.status(200).json({
          success: true,
          data: doc,
          message: 'Document retrieved successfully'
        });
      } else if (code) {
        // Get document by access code
        const result = await executeQuery(
          `SELECT ad.*, c.name as client_name, d.title as document_title, d.id as document_id
           FROM assigned_documents ad
           LEFT JOIN clients c ON ad.client_id = c.id
           LEFT JOIN documents d ON ad.document_id = d.id
           WHERE ad.access_code = $1`,
          [code]
        );

        if (result.data.length === 0) {
          return res.status(404).json({
            error: 'Document not found',
            message: 'This access code was not found. Please check your code and try again.'
          });
        }

        const doc = result.data[0];

        // Check if code has expired
        if (doc.access_code_expires_at) {
          const expiresAt = new Date(doc.access_code_expires_at);
          const now = new Date();
          if (now > expiresAt) {
            return res.status(410).json({
              error: 'Access code expired',
              message: 'This access code has expired. Please contact your clinician for a new code.',
              expired_at: doc.access_code_expires_at
            });
          }
        }

        // Return both field names for compatibility
        doc.auth_code = doc.access_code;
        doc.template_name = doc.document_title;
        doc.template_id = doc.document_id;

        return res.status(200).json({
          success: true,
          data: doc,
          message: 'Document retrieved successfully'
        });
      } else {
        // Build query
        let query = `SELECT ad.*, c.name as client_name, d.title as document_title, d.id as document_id
                     FROM assigned_documents ad
                     LEFT JOIN clients c ON ad.client_id = c.id
                     LEFT JOIN documents d ON ad.document_id = d.id
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

        // Add compatibility fields
        const docs = result.data.map(doc => ({
          ...doc,
          auth_code: doc.access_code,
          template_name: doc.document_title,
          template_id: doc.document_id,
          expiration_date: doc.access_code_expires_at
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
      const { client_id, template_id, document_id, auth_code, access_code, template_name } = req.body;

      // Support both auth_code (legacy) and access_code (schema-correct)
      const code = access_code || auth_code;
      // Support both template_id (legacy) and document_id (schema-correct)
      const docId = document_id || template_id;

      if (!client_id || !docId || !code) {
        return res.status(400).json({
          error: 'client_id, document_id (or template_id), and access_code (or auth_code) are required'
        });
      }

      if (!dbConnected) {
        // Demo mode
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

        return res.status(200).json({
          success: true,
          data: {
            id: Date.now(),
            client_id,
            document_id: docId,
            template_id: docId,
            template_name,
            auth_code: code,
            access_code: code,
            status: 'pending',
            assigned_at: new Date().toISOString(),
            access_code_expires_at: expiresAt.toISOString(),
            expiration_date: expiresAt.toISOString()
          },
          message: 'Demo mode - document assigned'
        });
      }

      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const result = await executeQuery(
        `INSERT INTO assigned_documents (client_id, document_id, access_code, access_code_expires_at, status, assigned_at)
         VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
         RETURNING *`,
        [client_id, docId, code, expiresAt.toISOString()]
      );

      const doc = result.data[0];
      // Add compatibility fields
      doc.auth_code = doc.access_code;
      doc.template_id = doc.document_id;
      doc.expiration_date = doc.access_code_expires_at;

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



