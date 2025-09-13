const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { generateVerificationToken } = require('../utils/helpers');

const createUser = async (userData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // All your user creation logic here
        // (company check, user insertion, etc.)
        
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const checkExistingEmail = async (email) => {
    const query = 'SELECT user_id FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
};

module.exports = { createUser, checkExistingEmail };