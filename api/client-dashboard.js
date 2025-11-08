// Client Portal Dashboard API
// Provides comprehensive dashboard data for authenticated clients

const { initDatabase, executeQuery } = require('./utils/database-connection');

// Helper function to verify session token
async function verifySession(sessionToken) {
  if (!sessionToken) return null;

  const result = await executeQuery(
    `SELECT cs.*, cu.client_id, cu.email
     FROM client_sessions cs
     JOIN client_users cu ON cs.client_user_id = cu.id
     WHERE cs.session_token = $1
       AND cs.is_active = true
       AND cs.expires_at > CURRENT_TIMESTAMP`,
    [sessionToken]
  );

  return result.data.length > 0 ? result.data[0] : null;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    await initDatabase();

    // Extract session token from header
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader ? authHeader.replace('Bearer ', '') : req.query.sessionToken;

    // Verify session
    const session = await verifySession(sessionToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - invalid or expired session'
      });
    }

    // Handle both camelCase and snake_case
    const clientId = session.clientId || session.client_id;

    // Fetch client information
    const clientResult = await executeQuery(
      `SELECT id, name, email, phone, date_of_birth, address, city, state, zip_code,
              emergency_contact, emergency_phone, status
       FROM clients
       WHERE id = $1`,
      [clientId]
    );

    if (!clientResult.success || clientResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    const client = clientResult.data[0];

    // Fetch upcoming appointments
    const upcomingAppointmentsResult = await executeQuery(
      `SELECT id, title, description, appointment_date, appointment_time,
              duration_minutes, status, location, provider, appointment_type, notes
       FROM appointments
       WHERE client_id = $1
         AND appointment_date >= CURRENT_DATE
       ORDER BY appointment_date, appointment_time
       LIMIT 10`,
      [clientId]
    );

    // Fetch recent appointments
    const recentAppointmentsResult = await executeQuery(
      `SELECT id, title, description, appointment_date, appointment_time,
              duration_minutes, status, location, provider, appointment_type, notes
       FROM appointments
       WHERE client_id = $1
         AND appointment_date < CURRENT_DATE
       ORDER BY appointment_date DESC, appointment_time DESC
       LIMIT 10`,
      [clientId]
    );

    // Fetch invoices with balance summary
    const invoicesResult = await executeQuery(
      `SELECT id, invoice_number, invoice_date, due_date, total_amount,
              refund_amount, status, payment_date, description
       FROM invoices
       WHERE client_id = $1
       ORDER BY invoice_date DESC
       LIMIT 20`,
      [clientId]
    );

    // Calculate financial summary
    const financialSummaryResult = await executeQuery(
      `SELECT
         COUNT(*) as total_invoices,
         SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
         SUM(CASE WHEN status IN ('pending', 'overdue') THEN total_amount ELSE 0 END) as total_outstanding,
         SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END) as total_overdue
       FROM invoices
       WHERE client_id = $1`,
      [clientId]
    );

    // Fetch assigned documents
    const documentsResult = await executeQuery(
      `SELECT ad.id, ad.status, ad.viewed_at, ad.signed_at, ad.assigned_at,
              d.title, d.description, d.document_type
       FROM assigned_documents ad
       JOIN documents d ON ad.document_id = d.id
       WHERE ad.client_id = $1
       ORDER BY ad.assigned_at DESC
       LIMIT 20`,
      [clientId]
    );

    // Fetch recent messages
    const messagesResult = await executeQuery(
      `SELECT id, subject, message, message_type, priority, is_read,
              sender_name, created_at
       FROM client_messages
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [clientId]
    );

    // Count unread messages
    const unreadCountResult = await executeQuery(
      `SELECT COUNT(*) as count
       FROM client_messages
       WHERE client_id = $1 AND is_read = false`,
      [clientId]
    );

    // Fetch payment methods
    const paymentMethodsResult = await executeQuery(
      `SELECT id, type, last4, brand, expiry_month, expiry_year,
              is_default, is_autopay_enabled
       FROM payment_methods
       WHERE client_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [clientId]
    );

    // Fetch notification settings
    const notificationSettingsResult = await executeQuery(
      `SELECT email_notifications, sms_notifications,
              email_appointment_reminders, email_invoice_reminders,
              email_document_updates, preferred_contact_method,
              reminder_advance_hours
       FROM client_notification_settings
       WHERE client_id = $1`,
      [clientId]
    );

    // Build comprehensive dashboard response
    const dashboardData = {
      client: client,
      appointments: {
        upcoming: upcomingAppointmentsResult.success ? upcomingAppointmentsResult.data : [],
        recent: recentAppointmentsResult.success ? recentAppointmentsResult.data : [],
        upcomingCount: upcomingAppointmentsResult.success ? upcomingAppointmentsResult.data.length : 0
      },
      invoices: {
        list: invoicesResult.success ? invoicesResult.data : [],
        summary: (financialSummaryResult.success && financialSummaryResult.data[0]) || {
          total_invoices: 0,
          total_paid: 0,
          total_outstanding: 0,
          total_overdue: 0
        }
      },
      documents: {
        list: documentsResult.success ? documentsResult.data : [],
        pendingCount: documentsResult.success ? documentsResult.data.filter(d => d.status === 'pending').length : 0,
        signedCount: documentsResult.success ? documentsResult.data.filter(d => d.status === 'signed').length : 0
      },
      messages: {
        list: messagesResult.success ? messagesResult.data : [],
        unreadCount: (unreadCountResult.success && unreadCountResult.data[0]?.count) || 0
      },
      paymentMethods: paymentMethodsResult.success ? paymentMethodsResult.data : [],
      notificationSettings: (notificationSettingsResult.success && notificationSettingsResult.data[0]) || null
    };

    // Update session activity
    await executeQuery(
      `UPDATE client_sessions
       SET last_activity = CURRENT_TIMESTAMP
       WHERE session_token = $1`,
      [sessionToken]
    );

    return res.status(200).json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
      debug: {
        clientId: clientId,
        queriesExecuted: {
          appointments: upcomingAppointmentsResult.success,
          invoices: invoicesResult.success,
          documents: documentsResult.success,
          messages: messagesResult.success
        }
      }
    });

  } catch (error) {
    console.error('Client dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
