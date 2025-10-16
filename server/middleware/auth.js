const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 Auth middleware called for:', req.method, req.path);
    
    const authHeader = req.headers['authorization'];
    console.log('📋 Auth header:', authHeader ? 'exists' : 'missing');
    
    // Check for token in Authorization header first
    let token = authHeader && authHeader.split(' ')[1];
    
    // Fallback to query parameter (for iframe and direct file access)
    if (!token && req.query.token) {
      token = req.query.token;
      console.log('🔑 Token found in query parameter');
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    console.log('🔐 Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', { email: decoded.email, userId: decoded.userId });

    const { data: userResults, error } = await supabase
      .rpc('get_user_with_company', { user_email: decoded.email });

    if (error || !userResults || userResults.length === 0) {
      console.log('❌ User not found in database:', error);
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = userResults[0];
    console.log('👤 User found:', { id: user.user_id, email: user.email, status: user.user_status });

    if (user.user_status !== 'Active') {
      console.log('❌ User account not active');
      return res.status(403).json({
        success: false,
        message: 'Account is no longer active'
      });
    }

    req.user = {
      id: user.user_id,
      email: user.email,
      userType: user.user_type,
      companyId: user.company_id,
      permissions: user.permissions
    };

    console.log('✅ Authentication successful for user:', user.user_id);
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.name, error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { authenticateToken };