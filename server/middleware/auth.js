// middleware/auth.js
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get fresh user data
    const { data: userResults, error } = await supabase
      .rpc('get_user_with_company', { user_email: decoded.email });

    if (error || !userResults || userResults.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = userResults[0];

    // Check if user is still active
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

module.exports = { authenticateToken };