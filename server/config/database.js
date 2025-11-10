const { Pool } = require('pg');

if (!process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
    process.exit(1);
}

const pool = new Pool({
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT || 5432,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
    statement_timeout: 30000,
});

pool.connect((err, client, release) => {
    if (err) {
        
        if (err.message.includes('timeout')) {
        } else if (err.message.includes('password authentication failed')) {
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
        }
        
        process.exit(1);
    } else {
        release();
    }
});

pool.on('error', (err, client) => {
});

process.on('SIGTERM', () => {
    pool.end(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    pool.end(() => {
        process.exit(0);
    });
});

module.exports = pool;