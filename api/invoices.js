// Invoices API Endpoint
// Manages invoices with database integration

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

    // GET: Retrieve invoices
    if (req.method === 'GET') {
      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Demo mode - no database connection'
        });
      }

      const { id, client_id, status } = req.query;

      if (id) {
        // Get single invoice
        const result = await executeQuery(
          `SELECT i.*, c.name as client_name 
           FROM invoices i
           LEFT JOIN clients c ON i.client_id = c.id
           WHERE i.id = $1`,
          [id]
        );

        if (result.data.length === 0) {
          return res.status(404).json({ error: 'Invoice not found' });
        }

        // Parse services JSON
        const invoice = result.data[0];
        invoice.services = typeof invoice.services === 'string' 
          ? JSON.parse(invoice.services) 
          : invoice.services;

        return res.status(200).json({
          success: true,
          data: invoice,
          message: 'Invoice retrieved successfully'
        });
      } else {
        // Build query
        let query = `SELECT i.*, c.name as client_name 
                     FROM invoices i
                     LEFT JOIN clients c ON i.client_id = c.id
                     WHERE 1=1`;
        const params = [];
        let paramCount = 1;

        if (client_id) {
          query += ` AND i.client_id = $${paramCount++}`;
          params.push(client_id);
        }

        if (status) {
          query += ` AND i.status = $${paramCount++}`;
          params.push(status);
        }

        query += ' ORDER BY i.created_at DESC';

        const result = await executeQuery(query, params);

        // Parse services JSON for all invoices
        const invoices = result.data.map(invoice => ({
          ...invoice,
          services: typeof invoice.services === 'string' 
            ? JSON.parse(invoice.services) 
            : invoice.services
        }));

        return res.status(200).json({
          success: true,
          data: invoices,
          message: 'Invoices retrieved successfully'
        });
      }
    }

    // POST: Create invoice
    if (req.method === 'POST') {
      const { 
        client_id, 
        invoice_number, 
        due_date, 
        notes, 
        services, 
        total_amount, 
        status,
        appointment_id 
      } = req.body;

      if (!client_id || !invoice_number || !due_date || !total_amount) {
        return res.status(400).json({ 
          error: 'client_id, invoice_number, due_date, and total_amount are required' 
        });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: {
            id: Date.now(),
            client_id,
            invoice_number,
            due_date,
            notes,
            services: services || [],
            total_amount,
            status: status || 'pending',
            appointment_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          message: 'Demo mode - invoice created'
        });
      }

      const result = await executeQuery(
        `INSERT INTO invoices (client_id, invoice_number, due_date, notes, services, total_amount, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          client_id,
          invoice_number,
          due_date,
          notes || null,
          JSON.stringify(services || []),
          total_amount,
          status || 'pending'
        ]
      );

      const invoice = result.data[0];
      invoice.services = typeof invoice.services === 'string' 
        ? JSON.parse(invoice.services) 
        : invoice.services;

      return res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice created successfully'
      });
    }

    // PUT: Update invoice
    if (req.method === 'PUT') {
      const { 
        id, 
        status, 
        payment_date, 
        stripe_payment_intent_id,
        refund_amount,
        refund_reason 
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          data: { id, status, payment_date },
          message: 'Demo mode - invoice updated'
        });
      }

      // Build dynamic update query
      const updates = [];
      const params = [];
      let paramCount = 1;

      if (status) {
        updates.push(`status = $${paramCount++}`);
        params.push(status);
      }

      if (payment_date !== undefined) {
        updates.push(`payment_date = $${paramCount++}`);
        params.push(payment_date);
      }

      if (stripe_payment_intent_id !== undefined) {
        updates.push(`stripe_payment_intent_id = $${paramCount++}`);
        params.push(stripe_payment_intent_id);
      }

      if (refund_amount !== undefined) {
        updates.push(`refund_amount = $${paramCount++}`);
        params.push(refund_amount);
      }

      if (refund_reason !== undefined) {
        updates.push(`refund_reason = $${paramCount++}`);
        params.push(refund_reason);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const query = `UPDATE invoices 
                     SET ${updates.join(', ')}
                     WHERE id = $${paramCount}
                     RETURNING *`;

      const result = await executeQuery(query, params);

      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const invoice = result.data[0];
      invoice.services = typeof invoice.services === 'string' 
        ? JSON.parse(invoice.services) 
        : invoice.services;

      return res.status(200).json({
        success: true,
        data: invoice,
        message: 'Invoice updated successfully'
      });
    }

    // DELETE: Delete invoice
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }

      if (!dbConnected) {
        return res.status(200).json({
          success: true,
          message: 'Demo mode - invoice deleted'
        });
      }

      const result = await executeQuery(
        'DELETE FROM invoices WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Invoices API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}



