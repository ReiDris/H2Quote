const { Pool } = require('pg');

// Validate required environment variables
if (!process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
    console.error('Missing required database environment variables');
    process.exit(1);
}

const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT || 5432,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD, // Remove fallback here
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

// Test connection (your version is better)
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err.stack);
        process.exit(1); // Add this to fail fast
    } else {
        console.log('Connected to PostgreSQL successfully');
        release();
    }
});

// Add error handling for ongoing connections
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;