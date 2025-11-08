const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    let token = authHeader && authHeader.split(' ')[1];
    
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: userResults, error } = await supabase
      .rpc('get_user_with_company', { user_email: decoded.email });

    if (error || !userResults || userResults.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = userResults[0];

    if (user.user_status !== 'Active') {
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

    next();
  } catch (error) {
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

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.userType;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };