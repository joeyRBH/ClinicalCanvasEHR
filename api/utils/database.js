/**
 * Database Configuration & Management
 * ClinicalCanvas EHR - HIPAA Compliant
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected error on idle client', err);
});

async function executeQuery(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn('[DATABASE] Slow query', { duration, text: text.substring(0, 100) });
    }
    
    return result;
  } catch (error) {
    console.error('[DATABASE] Query error', { 
      error: error.message, 
      code: error.code,
      text: text.substring(0, 100) 
    });
    throw error;
  }
}

async function getClient() {
  const client = await pool.connect();
  return client;
}

async function executeTransaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function checkHealth() {
  const start = Date.now();
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as database');
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: duration,
      database: result.rows[0].database,
      serverTime: result.rows[0].time,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingRequests: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - start
    };
  }
}

async function getStats() {
  try {
    const [tableStats, connectionStats] = await Promise.all([
      pool.query(`
        SELECT 
          schemaname,
          relname as table_name,
          n_live_tup as row_count
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT 
          numbackends as active_connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolled_back,
          blks_read as blocks_read,
          blks_hit as blocks_hit
        FROM pg_stat_database
        WHERE datname = current_database()
      `)
    ]);

    return {
      tables: tableStats.rows,
      connections: connectionStats.rows[0],
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    console.error('[DATABASE] Stats error', error);
    return { error: error.message };
  }
}

async function initializeTables() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_type VARCHAR(50) DEFAULT 'provider',
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC)
    `);
    
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)
    `);
    
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)
    `);

    console.log('[DATABASE] Tables initialized');
    return { success: true };
  } catch (error) {
    console.error('[DATABASE] Initialization error', error);
    return { success: false, error: error.message };
  }
}

async function closePool() {
  await pool.end();
  console.log('[DATABASE] Pool closed');
}

module.exports = {
  pool,
  executeQuery,
  getClient,
  executeTransaction,
  checkHealth,
  getStats,
  initializeTables,
  closePool
};
