// Debug endpoint to check what data exists for test patient
const { initDatabase, executeQuery } = require('./utils/database-connection');

export default async function handler(req, res) {
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    // Find test patient
    const clientResult = await executeQuery(
      `SELECT * FROM clients WHERE email = $1`,
      ['testpatient@clinicalcanvas.com']
    );

    if (!clientResult.success || clientResult.data.length === 0) {
      return res.status(404).json({
        error: 'Test patient not found in database',
        checked: 'clients table'
      });
    }

    const client = clientResult.data[0];
    const clientId = client.id;

    // Check appointments
    const appointments = await executeQuery(
      `SELECT * FROM appointments WHERE client_id = $1 ORDER BY appointment_date`,
      [clientId]
    );

    // Check invoices
    const invoices = await executeQuery(
      `SELECT * FROM invoices WHERE client_id = $1 ORDER BY invoice_date DESC`,
      [clientId]
    );

    // Check documents
    const documents = await executeQuery(
      `SELECT ad.*, d.title, d.description
       FROM assigned_documents ad
       JOIN documents d ON ad.document_id = d.id
       WHERE ad.client_id = $1`,
      [clientId]
    );

    // Check messages
    const messages = await executeQuery(
      `SELECT * FROM client_messages WHERE client_id = $1 ORDER BY created_at DESC`,
      [clientId]
    );

    // Check client_user
    const clientUser = await executeQuery(
      `SELECT id, email, is_active, created_at FROM client_users WHERE client_id = $1`,
      [clientId]
    );

    return res.status(200).json({
      success: true,
      clientId: clientId,
      clientEmail: client.email,
      clientName: client.name,
      clientStatus: client.status,
      data: {
        appointments: {
          count: appointments.success ? appointments.data.length : 0,
          success: appointments.success,
          error: appointments.error,
          data: appointments.data || []
        },
        invoices: {
          count: invoices.success ? invoices.data.length : 0,
          success: invoices.success,
          error: invoices.error,
          data: invoices.data || []
        },
        documents: {
          count: documents.success ? documents.data.length : 0,
          success: documents.success,
          error: documents.error,
          data: documents.data || []
        },
        messages: {
          count: messages.success ? messages.data.length : 0,
          success: messages.success,
          error: messages.error,
          data: messages.data || []
        },
        clientUser: {
          exists: clientUser.success && clientUser.data.length > 0,
          data: clientUser.data || []
        }
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({
      error: 'Debug failed',
      message: error.message,
      stack: error.stack
    });
  }
}
