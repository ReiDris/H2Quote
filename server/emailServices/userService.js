const bcrypt = require('bcrypt');
const pool = require('../config/database');

const createUser = async (userData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            companyId,
            firstName,
            lastName,
            email,
            phone,
            userType = 'client',
            passwordHash,
            isPrimaryContact = false,
            status = 'Inactive',
            department = null,
            permissions = null
        } = userData;

        if (!firstName || !lastName || !email || !passwordHash) {
            throw new Error('Missing required user data: firstName, lastName, email, and passwordHash are required');
        }

        const emailExists = await checkExistingEmail(email);
        if (emailExists) {
            throw new Error('Email already exists');
        }

        const insertUserQuery = `
            INSERT INTO users 
            (company_id, first_name, last_name, email, phone, user_type, password_hash, 
             is_primary_contact, status, department, permissions, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            RETURNING user_id, first_name, last_name, email, user_type, status, created_at
        `;

        const result = await client.query(insertUserQuery, [
            companyId,
            firstName,
            lastName,
            email,
            phone,
            userType,
            passwordHash,
            isPrimaryContact,
            status,
            department,
            permissions
        ]);
        
        await client.query('COMMIT');
        return result.rows[0];
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const createUserWithPassword = async (userData) => {
    const { password, ...otherData } = userData;
    
    if (!password) {
        throw new Error('Password is required');
    }
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    return await createUser({
        ...otherData,
        passwordHash
    });
};

const checkExistingEmail = async (email) => {
    const query = 'SELECT user_id FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
};

const getUserById = async (userId) => {
    const query = `
        SELECT u.*, c.company_name 
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.company_id
        WHERE u.user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
};

const updateUser = async (userId, updateData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const {
            firstName,
            lastName,
            phone,
            department,
            permissions,
            status
        } = updateData;

        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (firstName !== undefined) {
            updateFields.push(`first_name = $${paramCount++}`);
            values.push(firstName);
        }
        if (lastName !== undefined) {
            updateFields.push(`last_name = $${paramCount++}`);
            values.push(lastName);
        }
        if (phone !== undefined) {
            updateFields.push(`phone = $${paramCount++}`);
            values.push(phone);
        }
        if (department !== undefined) {
            updateFields.push(`department = $${paramCount++}`);
            values.push(department);
        }
        if (permissions !== undefined) {
            updateFields.push(`permissions = $${paramCount++}`);
            values.push(permissions);
        }
        if (status !== undefined) {
            updateFields.push(`status = $${paramCount++}`);
            values.push(status);
        }

        if (updateFields.length === 0) {
            throw new Error('No fields to update');
        }

        updateFields.push(`updated_at = NOW()`);
        values.push(userId);

        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE user_id = $${paramCount}
            RETURNING user_id, first_name, last_name, email, user_type, status, updated_at
        `;

        const result = await client.query(query, values);
        
        await client.query('COMMIT');
        return result.rows[0];
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateUserPassword = async (userId, newPassword) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        const query = `
            UPDATE users 
            SET password_hash = $1, updated_at = NOW()
            WHERE user_id = $2
            RETURNING user_id
        `;
        
        const result = await client.query(query, [passwordHash, userId]);
        
        if (result.rows.length === 0) {
            throw new Error('User not found');
        }
        
        await client.query('COMMIT');
        return result.rows[0];
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const deactivateUser = async (userId) => {
    return await updateUser(userId, { status: 'Inactive' });
};

const activateUser = async (userId) => {
    return await updateUser(userId, { status: 'Active' });
};

const getUsersByCompany = async (companyId) => {
    const query = `
        SELECT user_id, first_name, last_name, email, phone, user_type, 
               status, is_primary_contact, department, created_at
        FROM users 
        WHERE company_id = $1
        ORDER BY is_primary_contact DESC, created_at ASC
    `;
    const result = await pool.query(query, [companyId]);
    return result.rows;
};

const getUsersByType = async (userType) => {
    const query = `
        SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, 
               u.user_type, u.status, u.department, c.company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.company_id
        WHERE u.user_type = $1 AND u.status = 'Active'
        ORDER BY u.last_name, u.first_name
    `;
    const result = await pool.query(query, [userType]);
    return result.rows;
};

module.exports = { 
    createUser, 
    createUserWithPassword,
    checkExistingEmail,
    getUserById,
    updateUser,
    updateUserPassword,
    deactivateUser,
    activateUser,
    getUsersByCompany,
    getUsersByType
};