// Check Database Tables API Endpoint
// Lists all tables in the database

const { initDatabase, executeQuery } = require('./utils/database-connection');

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Initialize database connection
        const dbConnected = await initDatabase();
        
        if (!dbConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        // Get all tables
        const tablesResult = await executeQuery(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        if (!tablesResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Database error: ' + tablesResult.error
            });
        }

        // Get row counts for each table
        const tableCounts = {};
        for (const table of tablesResult.data) {
            const tableName = table.table_name;
            const countResult = await executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
            if (countResult.success) {
                tableCounts[tableName] = countResult.data[0].count;
            }
        }

        return res.status(200).json({
            success: true,
            tables: tablesResult.data.map(t => t.table_name),
            row_counts: tableCounts,
            total_tables: tablesResult.data.length
        });

    } catch (error) {
        console.error('Check tables error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

