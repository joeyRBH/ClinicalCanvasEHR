// Test database connection and run client portal setup
// Usage: node test-db-connection.js

const postgres = require('postgres');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    console.log('🔍 Testing database connection...\n');

    const DATABASE_URL = process.env.DATABASE_URL;

    if (!DATABASE_URL) {
        console.error('❌ DATABASE_URL not found in environment variables');
        console.log('\n📝 Please create a .env.local file with your Crunchy Bridge connection string:');
        console.log('DATABASE_URL=postgresql://username:password@hostname.db.postgresbridge.com:5432/dbname?sslmode=require');
        process.exit(1);
    }

    console.log('✓ DATABASE_URL found');
    console.log('Connection:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'), '\n');

    let sql;

    try {
        // Connect to database
        sql = postgres(DATABASE_URL, {
            ssl: 'require',
            max: 1,
            idle_timeout: 20,
            connect_timeout: 10
        });

        console.log('🔌 Connecting to database...');

        // Test query
        const result = await sql`SELECT version()`;
        console.log('✅ Connected successfully!');
        console.log('PostgreSQL version:', result[0].version.split(' ')[1], '\n');

        // Check if client portal tables exist
        console.log('🔍 Checking for client portal tables...');

        const tables = await sql`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename IN ('client_users', 'client_notification_settings', 'notification_log', 'client_messages', 'client_sessions')
            ORDER BY tablename
        `;

        const existingTables = tables.map(t => t.tablename);
        const requiredTables = ['client_users', 'client_notification_settings', 'notification_log', 'client_messages', 'client_sessions'];
        const missingTables = requiredTables.filter(t => !existingTables.includes(t));

        if (missingTables.length === 0) {
            console.log('✅ All client portal tables exist!');
            existingTables.forEach(table => console.log(`   ✓ ${table}`));
        } else {
            console.log('⚠️  Missing client portal tables:');
            missingTables.forEach(table => console.log(`   ✗ ${table}`));

            console.log('\n📋 Would you like to create the missing tables? (y/n)');

            // In a real scenario, you'd prompt for user input
            // For now, we'll show instructions
            console.log('\n📝 To create the tables, run:');
            console.log('psql "$DATABASE_URL" -f setup-client-portal.sql');
            console.log('\nOr connect to your Crunchy Bridge dashboard and run the SQL from setup-client-portal.sql');
        }

        console.log('\n✅ Database connection test complete!');

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);

        if (error.message.includes('ENOTFOUND')) {
            console.log('\n💡 DNS lookup failed. Check your hostname.');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Connection refused. Check your port and firewall settings.');
        } else if (error.message.includes('password authentication failed')) {
            console.log('\n💡 Authentication failed. Check your username and password.');
        } else if (error.message.includes('SSL')) {
            console.log('\n💡 SSL connection issue. Make sure ?sslmode=require is in your connection string.');
        }

        process.exit(1);
    } finally {
        if (sql) {
            await sql.end();
        }
    }
}

testConnection();
