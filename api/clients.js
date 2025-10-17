// Clients API Endpoint
// Manages client records with database integration

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

    // GET: Retrieve clients
    if (req.method === 'GET') {
      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Demo mode - no database connection'
        });
      }

      const { id } = req.query;

      if (id) {
        // Get single client
        const result = await executeQuery(
          'SELECT * FROM clients WHERE id = $1',
          [id]
        );

        if (result.data.length === 0) {
          return res.status(404).json({ error: 'Client not found' });
        }

        return res.status(200).json({
          success: true,
          data: result.data[0],
          message: 'Client retrieved successfully'
        });
      } else {
        // Get all clients
        const result = await executeQuery(
          'SELECT * FROM clients ORDER BY created_at DESC'
        );

        return res.status(200).json({
          success: true,
          data: result.data,
          message: 'Clients retrieved successfully'
        });
      }
    }

    // POST: Create client
    if (req.method === 'POST') {
      const { name, email, phone, dob, notes } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: {
            id: Date.now(),
            name,
            email,
            phone,
            dob,
            notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          message: 'Demo mode - client created'
        });
      }

      const result = await executeQuery(
        `INSERT INTO clients (name, email, phone, dob, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [name, email || null, phone || null, dob || null, notes || null]
      );

      return res.status(201).json({
        success: true,
        data: result.data[0],
        message: 'Client created successfully'
      });
    }

    // PUT: Update client
    if (req.method === 'PUT') {
      const { id, name, email, phone, dob, notes } = req.body;

      if (!id || !name) {
        return res.status(400).json({ error: 'ID and name are required' });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: { id, name, email, phone, dob, notes },
          message: 'Demo mode - client updated'
        });
      }

      const result = await executeQuery(
        `UPDATE clients 
         SET name = $1, email = $2, phone = $3, dob = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [name, email || null, phone || null, dob || null, notes || null, id]
      );

      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      return res.status(200).json({
        success: true,
        data: result.data[0],
        message: 'Client updated successfully'
      });
    }

    // DELETE: Delete client
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          message: 'Demo mode - client deleted'
        });
      }

      const result = await executeQuery(
        'DELETE FROM clients WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Client deleted successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Clients API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

