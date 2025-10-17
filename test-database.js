#!/usr/bin/env node

// Database Connection Test Script
// Run this to verify your Neon database connection

const { Client } = require('@neondatabase/serverless');

async function testConnection() {
  console.log('🔍 Testing Neon Database Connection...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable not set');
    console.log('   Please set DATABASE_URL in your Vercel project settings\n');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL found');
  console.log('   Connection string:', process.env.DATABASE_URL.substring(0, 30) + '...\n');

  const client = new Client(process.env.DATABASE_URL);

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test query
    console.log('🧪 Running test query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query successful!');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].pg_version.split(',')[0]);
    console.log('');

    // Check tables
    console.log('📊 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found. Run schema.sql to create tables.');
    } else {
      console.log('✅ Found', tablesResult.rows.length, 'tables:');
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }

    console.log('\n✅ Database connection test PASSED!');
    console.log('   Your Neon database is ready to use.\n');

  } catch (error) {
    console.error('❌ Database connection test FAILED!');
    console.error('   Error:', error.message);
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the test
testConnection();

