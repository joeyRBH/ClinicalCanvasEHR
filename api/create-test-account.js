// Emergency test account creator - creates a test client portal account
const { initDatabase, executeQuery } = require('./utils/database-connection');
const bcrypt = require('bcrypt');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDatabase();

    // Create test client if doesn't exist
    let clientResult = await executeQuery(
      `SELECT id FROM clients WHERE email = $1`,
      ['testpatient@clinicalcanvas.com']
    );

    let clientId;
    if (clientResult.rows.length === 0) {
      // Create test client
      clientResult = await executeQuery(
        `INSERT INTO clients (name, email, phone, date_of_birth, status, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING id`,
        ['Test Patient', 'testpatient@clinicalcanvas.com', '555-123-4567', '1990-01-01', 'active']
      );
      clientId = clientResult.rows[0].id;
    } else {
      clientId = clientResult.rows[0].id;
    }

    // Check if client_user already exists
    const existingUser = await executeQuery(
      `SELECT id FROM client_users WHERE client_id = $1`,
      [clientId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Test account already exists',
        credentials: {
          email: 'testpatient@clinicalcanvas.com',
          password: 'testpassword123',
          note: 'Use these credentials to log in at /client-portal.html'
        }
      });
    }

    // Create password hash
    const passwordHash = await bcrypt.hash('testpassword123', 10);

    // Create client_user
    await executeQuery(
      `INSERT INTO client_users (client_id, email, password_hash, is_active, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [clientId, 'testpatient@clinicalcanvas.com', passwordHash]
    );

    // Create default notification settings
    await executeQuery(
      `INSERT INTO client_notification_settings (client_id, created_at, updated_at)
       VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (client_id) DO NOTHING`,
      [clientId]
    );

    return res.status(200).json({
      success: true,
      message: 'Test account created successfully!',
      credentials: {
        email: 'testpatient@clinicalcanvas.com',
        password: 'testpassword123',
        note: 'Use these credentials to log in at /client-portal.html'
      }
    });

  } catch (error) {
    console.error('Error creating test account:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create test account',
      details: error.message
    });
  }
}
