// Database Connection Utility
// Handles connection to PostgreSQL (Neon) with fallback to demo mode

let sqlClient = null;
let isConnected = false;

/**
 * Initialize database connection
 * Returns true if connected, false if using demo mode
 */
async function initDatabase() {
    if (!process.env.DATABASE_URL) {
        console.log('📦 Running in demo mode (no DATABASE_URL set)');
        return false;
    }

    try {
        const { Client } = require('@neondatabase/serverless');
        sqlClient = new Client(process.env.DATABASE_URL);
        await sqlClient.connect();
        isConnected = true;
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('📦 Falling back to demo mode');
        return false;
    }
}

/**
 * Get database client
 * Returns null if not connected (demo mode)
 */
function getClient() {
    return isConnected ? sqlClient : null;
}

/**
 * Check if database is connected
 */
function isDatabaseConnected() {
    return isConnected;
}

/**
 * Close database connection
 */
async function closeDatabase() {
    if (sqlClient && isConnected) {
        try {
            await sqlClient.end();
            isConnected = false;
            console.log('✅ Database connection closed');
        } catch (error) {
            console.error('❌ Error closing database:', error.message);
        }
    }
}

/**
 * Execute a query with error handling
 * Returns { success: boolean, data: [], error: string }
 */
async function executeQuery(query, params = []) {
    if (!isConnected) {
        return {
            success: false,
            data: [],
            error: 'Database not connected - running in demo mode'
        };
    }

    try {
        const result = await sqlClient.query(query, params);
        return {
            success: true,
            data: result.rows,
            error: null
        };
    } catch (error) {
        console.error('Database query error:', error);
        return {
            success: false,
            data: [],
            error: error.message
        };
    }
}

/**
 * Execute a transaction
 * Returns { success: boolean, data: any, error: string }
 */
async function executeTransaction(queries) {
    if (!isConnected) {
        return {
            success: false,
            data: null,
            error: 'Database not connected - running in demo mode'
        };
    }

    try {
        await sqlClient.query('BEGIN');
        
        const results = [];
        for (const { query, params } of queries) {
            const result = await sqlClient.query(query, params || []);
            results.push(result.rows);
        }
        
        await sqlClient.query('COMMIT');
        
        return {
            success: true,
            data: results,
            error: null
        };
    } catch (error) {
        await sqlClient.query('ROLLBACK');
        console.error('Transaction error:', error);
        return {
            success: false,
            data: null,
            error: error.message
        };
    }
}

module.exports = {
    initDatabase,
    getClient,
    isDatabaseConnected,
    closeDatabase,
    executeQuery,
    executeTransaction
};



