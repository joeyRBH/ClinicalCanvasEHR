// Setup Admin User API Endpoint
// Creates the default admin user if it doesn't exist

const { initDatabase, executeQuery } = require('./utils/database-connection');
const crypto = require('crypto');

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
        // Initialize database connection
        const dbConnected = await initDatabase();
        
        if (!dbConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected. Please set DATABASE_URL environment variable.'
            });
        }

        // Security: Get credentials from environment variables or request body
        const username = req.body.username || process.env.ADMIN_USERNAME;
        const password = req.body.password || process.env.ADMIN_PASSWORD;
        const name = req.body.name || process.env.ADMIN_NAME || 'Admin User';
        const email = req.body.email || process.env.ADMIN_EMAIL || 'admin@clinicalcanvas.app';

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Admin credentials must be provided via request body or environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)'
            });
        }

        // Check if admin user already exists
        const checkResult = await executeQuery(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (!checkResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Database error: ' + checkResult.error
            });
        }

        if (checkResult.data.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Admin user already exists',
                user_id: checkResult.data[0].id
            });
        }

        // Simple hash for demo - in production use bcrypt
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        const insertResult = await executeQuery(
            `INSERT INTO users (username, password_hash, name, email, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, name, role`,
            [username, passwordHash, name, email, 'admin']
        );

        if (!insertResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Failed to create admin user: ' + insertResult.error
            });
        }

        console.log('✅ Admin user created successfully');

        return res.status(201).json({
            success: true,
            message: '✅ Admin user created successfully. Please store credentials securely.',
            user: {
                id: insertResult.data[0].id,
                username: insertResult.data[0].username,
                name: insertResult.data[0].name,
                role: insertResult.data[0].role
            }
        });

    } catch (error) {
        console.error('Setup admin error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

