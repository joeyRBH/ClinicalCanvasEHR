/**
 * Client Autopay Settings API
 * Manages autopay settings for clients (clinician access)
 */

const { initDatabase, getSqlClient } = require('./utils/database-connection');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();
    const sql = getSqlClient();

    // GET: Retrieve all active clients with their autopay status
    if (req.method === 'GET') {
      try {
        const result = await sql`
          SELECT
            c.id,
            c.name,
            c.email,
            c.autopay_enabled,
            c.stripe_customer_id,
            pm.id as payment_method_id,
            pm.last4,
            pm.brand,
            pm.expiry_month,
            pm.expiry_year,
            pm.is_default
          FROM clients c
          LEFT JOIN payment_methods pm ON pm.client_id = c.id AND pm.is_default = true
          WHERE c.status = 'active'
          ORDER BY c.name ASC
        `;

        return res.status(200).json({
          success: true,
          data: result,
          message: 'Client autopay settings retrieved successfully'
        });

      } catch (error) {
        throw error;
      }
    }

    // PUT: Update autopay status for a single client
    if (req.method === 'PUT') {
      const { client_id, autopay_enabled } = req.body;

      if (!client_id || typeof autopay_enabled !== 'boolean') {
        return res.status(400).json({
          error: 'client_id and autopay_enabled (boolean) are required'
        });
      }

      try {
        // Check if client has a default payment method
        if (autopay_enabled) {
          const pmCheck = await sql`
            SELECT id FROM payment_methods
            WHERE client_id = ${client_id} AND is_default = true
          `;

          if (pmCheck.length === 0) {
            return res.status(400).json({
              error: 'Cannot enable autopay: client has no default payment method on file'
            });
          }
        }

        // Update client autopay status
        await sql`
          UPDATE clients
          SET autopay_enabled = ${autopay_enabled},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${client_id}
        `;

        return res.status(200).json({
          success: true,
          message: `Autopay ${autopay_enabled ? 'enabled' : 'disabled'} successfully`
        });

      } catch (error) {
        throw error;
      }
    }

    // POST: Bulk update autopay status for multiple clients
    if (req.method === 'POST') {
      const { client_ids, autopay_enabled } = req.body;

      if (!Array.isArray(client_ids) || typeof autopay_enabled !== 'boolean') {
        return res.status(400).json({
          error: 'client_ids (array) and autopay_enabled (boolean) are required'
        });
      }

      try {
        const results = {
          success: [],
          failed: []
        };

        for (const clientId of client_ids) {
          try {
            // Check if client has a default payment method
            if (autopay_enabled) {
              const pmCheck = await sql`
                SELECT id FROM payment_methods
                WHERE client_id = ${clientId} AND is_default = true
              `;

              if (pmCheck.length === 0) {
                results.failed.push({
                  client_id: clientId,
                  reason: 'No default payment method on file'
                });
                continue;
              }
            }

            // Update client autopay status
            await sql`
              UPDATE clients
              SET autopay_enabled = ${autopay_enabled},
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ${clientId}
            `;

            results.success.push(clientId);

          } catch (error) {
            results.failed.push({
              client_id: clientId,
              reason: error.message
            });
          }
        }

        return res.status(200).json({
          success: true,
          data: results,
          message: `Autopay ${autopay_enabled ? 'enabled' : 'disabled'} for ${results.success.length} client(s)`
        });

      } catch (error) {
        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Client autopay settings API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
