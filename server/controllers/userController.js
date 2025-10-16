const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getAllUsers = async (req, res) => {
  try {
    // Get all admin and staff users
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email, user_type, status, created_at')
      .in('user_type', ['admin', 'staff'])
      .eq('status', 'Active')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

module.exports = {
  getAllUsers
};