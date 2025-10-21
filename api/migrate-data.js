// Data Migration API Endpoint
// Helps migrate data from localStorage to PostgreSQL database

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dataType, data } = req.body;

    if (!dataType || !data) {
      return res.status(400).json({ 
        error: 'dataType and data are required' 
      });
    }

    // Check if database is connected
    if (!process.env.DATABASE_URL) {
      return res.status(400).json({ 
        error: 'Database not configured. Set DATABASE_URL environment variable.' 
      });
    }

    const { Client } = require('@neondatabase/serverless');
    const sql = new Client(process.env.DATABASE_URL);
    await sql.connect();

    try {
      let result;
      let migratedCount = 0;

      switch (dataType) {
        case 'clients':
          // Migrate clients
          for (const client of data) {
            try {
              await sql.query(
                `INSERT INTO clients (id, name, email, phone, dob, notes, stripe_customer_id, autopay_enabled, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  client.id,
                  client.name,
                  client.email || null,
                  client.phone || null,
                  client.dob || null,
                  client.notes || null,
                  client.stripe_customer_id || null,
                  client.autopay_enabled || false,
                  client.created_at || new Date().toISOString(),
                  client.updated_at || new Date().toISOString()
                ]
              );
              migratedCount++;
            } catch (error) {
              console.error('Error migrating client:', client.id, error.message);
            }
          }
          break;

        case 'appointments':
          // Migrate appointments
          for (const appointment of data) {
            try {
              await sql.query(
                `INSERT INTO appointments (id, client_id, appointment_date, appointment_time, duration, type, cpt_code, notes, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  appointment.id,
                  appointment.client_id,
                  appointment.appointment_date,
                  appointment.appointment_time,
                  appointment.duration || 60,
                  appointment.type || null,
                  appointment.cpt_code || null,
                  appointment.notes || null,
                  appointment.status || 'scheduled',
                  appointment.created_at || new Date().toISOString(),
                  appointment.updated_at || new Date().toISOString()
                ]
              );
              migratedCount++;
            } catch (error) {
              console.error('Error migrating appointment:', appointment.id, error.message);
            }
          }
          break;

        case 'invoices':
          // Migrate invoices
          for (const invoice of data) {
            try {
              await sql.query(
                `INSERT INTO invoices (id, client_id, invoice_number, due_date, notes, services, total_amount, status, payment_date, 
                                      stripe_payment_intent_id, autopay_attempted, autopay_result, refund_amount, refund_reason, 
                                      thrizer_claim_status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  invoice.id,
                  invoice.client_id,
                  invoice.invoice_number,
                  invoice.due_date,
                  invoice.notes || null,
                  JSON.stringify(invoice.services || []),
                  invoice.total_amount,
                  invoice.status || 'pending',
                  invoice.payment_date || null,
                  invoice.stripe_payment_intent_id || null,
                  invoice.autopay_attempted || false,
                  invoice.autopay_result || null,
                  invoice.refund_amount || 0,
                  invoice.refund_reason || null,
                  invoice.thrizer_claim_status || null,
                  invoice.created_at || new Date().toISOString(),
                  invoice.updated_at || new Date().toISOString()
                ]
              );
              migratedCount++;
            } catch (error) {
              console.error('Error migrating invoice:', invoice.id, error.message);
            }
          }
          break;

        case 'assigned_docs':
          // Migrate assigned documents
          for (const doc of data) {
            try {
              await sql.query(
                `INSERT INTO assigned_documents (id, client_id, template_id, auth_code, status, assigned_at, completed_at, 
                                                  responses, client_signature, clinician_signature)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  doc.id,
                  doc.client_id,
                  doc.template_id,
                  doc.auth_code,
                  doc.status || 'pending',
                  doc.assigned_at || doc.created_at || new Date().toISOString(),
                  doc.completed_at || null,
                  JSON.stringify(doc.responses || doc.form_data || {}),
                  doc.client_signature || null,
                  doc.clinician_signature || null
                ]
              );
              migratedCount++;
            } catch (error) {
              console.error('Error migrating document:', doc.id, error.message);
            }
          }
          break;

        default:
          await sql.end();
          return res.status(400).json({ 
            error: `Unknown data type: ${dataType}` 
          });
      }

      await sql.end();

      return res.status(200).json({
        success: true,
        message: `Successfully migrated ${migratedCount} ${dataType}`,
        migrated: migratedCount,
        total: data.length
      });

    } catch (error) {
      await sql.end();
      throw error;
    }

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ 
      error: 'Migration failed',
      message: error.message 
    });
  }
}



