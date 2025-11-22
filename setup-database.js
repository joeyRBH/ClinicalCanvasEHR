// Automatic Database Setup Script for Crunchy Bridge
// Run this with: node setup-database.js

const fs = require('fs');
const postgres = require('postgres');

// Your Crunchy Bridge connection string
const DATABASE_URL = 'postgres://application:KroHm2EPRm7rwiCAnEFv8D4ERWtk37NcTf52R99LPXeCFEQkUJtbrTrrIoQdxEf7@p.rlqafgefofftpkivbewroi3b6e.db.postgresbridge.com:5432/postgres?sslmode=require';

console.log('🚀 Sessionably - Database Setup\n');
console.log('Connecting to Crunchy Bridge...');

async function setupDatabase() {
  let sql;

  try {
    // Connect to database
    sql = postgres(DATABASE_URL, {
      ssl: 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30
    });

    console.log('✅ Connected to Crunchy Bridge\n');

    // Read the schema file
    console.log('📄 Reading schema.sql...');
    const schema = fs.readFileSync('./schema.sql', 'utf8');

    // Execute the schema
    console.log('⚙️  Creating database tables...\n');
    await sql.unsafe(schema);

    console.log('\n✅ SUCCESS! Database schema created!\n');
    console.log('📊 Created:');
    console.log('   - 9 tables (clients, invoices, appointments, etc.)');
    console.log('   - Indexes for performance');
    console.log('   - Triggers for timestamps');
    console.log('   - 3 reporting views');
    console.log('   - Sample admin user (username: admin, password: admin123)');
    console.log('   - Sample document templates\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log(`\n✅ Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`   - ${t.tablename}`));

    console.log('\n🎉 Database is ready to use!\n');
    console.log('Next steps:');
    console.log('1. Add DATABASE_URL to Vercel environment variables');
    console.log('2. Deploy your app');
    console.log('3. Test at: https://your-app.vercel.app/api/health\n');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);

    if (sql) await sql.end();
    process.exit(1);
  }
}

setupDatabase();
