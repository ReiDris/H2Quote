const { Pool } = require('pg');

// Validate required environment variables
if (!process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
    console.error('❌ Missing required database environment variables');
    console.error('Required: SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD');
    process.exit(1);
}

// Log connection details (without password) for debugging
console.log('🔍 Database Connection Details:');
console.log('Host:', process.env.SUPABASE_DB_HOST);
console.log('Port:', process.env.SUPABASE_DB_PORT || 5432);
console.log('Database:', process.env.SUPABASE_DB_NAME || 'postgres');
console.log('User:', process.env.SUPABASE_DB_USER || 'postgres');
console.log('SSL:', 'enabled (rejectUnauthorized: false)');

const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT || 5432,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false // Required for Supabase
    },
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds
    // Add these for better connection handling
    query_timeout: 30000, // Query timeout 30 seconds
    statement_timeout: 30000, // Statement timeout 30 seconds
});

// Test connection with detailed error reporting
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:');
        console.error('Error Message:', err.message);
        console.error('Error Code:', err.code);
        
        // Provide helpful troubleshooting hints
        if (err.message.includes('timeout')) {
            console.error('\n💡 Troubleshooting Tips for Timeout:');
            console.error('1. Check your SUPABASE_DB_HOST is correct (should be db.xxxxx.supabase.co)');
            console.error('2. Verify your firewall/network allows outbound connections on port 5432');
            console.error('3. Check if you are behind a corporate proxy or VPN');
            console.error('4. Verify your database password is correct');
            console.error('5. Check Supabase status: https://status.supabase.com/');
        } else if (err.message.includes('password authentication failed')) {
            console.error('\n💡 Password Error: Check your SUPABASE_DB_PASSWORD in .env file');
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
            console.error('\n💡 Host Not Found: Check your SUPABASE_DB_HOST in .env file');
            console.error('   It should look like: db.xxxxxxxxx.supabase.co');
        }
        
        console.error('\n📋 Full error stack:', err.stack);
        process.exit(1);
    } else {
        console.log('✅ Connected to PostgreSQL successfully');
        console.log('Database:', client.database);
        console.log('Host:', client.host);
        release();
    }
});

// Handle pool errors (connection issues after initial connection)
pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle client:', err.message);
    console.error('This might cause issues with subsequent requests');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, closing database pool...');
    pool.end(() => {
        console.log('✅ Database pool closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, closing database pool...');
    pool.end(() => {
        console.log('✅ Database pool closed');
        process.exit(0);
    });
});

module.exports = pool;