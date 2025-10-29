// Database Setup API Endpoint
// Visit this URL ONCE to create all database tables
// Example: https://your-app.vercel.app/api/setup-database

const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        error: 'DATABASE_URL not configured',
        message: 'Please add DATABASE_URL to Vercel environment variables first',
        instructions: [
          '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
          '2. Add DATABASE_URL with your Crunchy Bridge connection string',
          '3. Redeploy your app',
          '4. Visit this URL again'
        ]
      });
    }

    // Import postgres client
    const postgres = require('postgres');

    // Connect to database
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30
    });

    // Read schema file
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await sql.unsafe(schema);

    // Verify tables were created
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    await sql.end();

    // Return success
    return res.status(200).json({
      success: true,
      message: '🎉 Database setup complete!',
      created: {
        tables: tables.length,
        tableNames: tables.map(t => t.tablename)
      },
      details: {
        tablesCreated: [
          'clients',
          'appointments',
          'invoices',
          'invoice_line_items',
          'payment_methods',
          'payment_transactions',
          'documents',
          'assigned_documents',
          'audit_log',
          'users'
        ],
        indexesCreated: '25+ indexes for performance',
        triggersCreated: '7 auto-timestamp triggers',
        viewsCreated: [
          'v_clients_with_payment_status',
          'v_upcoming_appointments',
          'v_revenue_summary'
        ],
        sampleData: [
          'Admin user (username: admin, password: admin123)',
          'Document templates (Informed Consent, HIPAA Notice, Treatment Agreement)'
        ]
      },
      nextSteps: [
        '✅ Database is ready!',
        '🔒 Change the default admin password',
        '🧪 Test the connection at /api/health',
        '🚀 Your app is ready to use'
      ]
    });

  } catch (error) {
    console.error('Database setup error:', error);

    // Check if tables already exist
    if (error.message.includes('already exists')) {
      return res.status(200).json({
        success: true,
        message: '✅ Database already set up!',
        note: 'Tables already exist. No action needed.',
        nextSteps: [
          '🧪 Test the connection at /api/health',
          '🚀 Your app is ready to use'
        ]
      });
    }

    return res.status(500).json({
      error: 'Database setup failed',
      message: error.message,
      details: error.toString(),
      troubleshooting: [
        'Check that DATABASE_URL is correct in Vercel environment variables',
        'Ensure DATABASE_URL includes ?sslmode=require at the end',
        'Verify your Crunchy Bridge cluster is running (green status)',
        'Check Vercel function logs for more details'
      ]
    });
  }
}
