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

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { user_type } = req.body;

    // Validate user_type
    if (!user_type || !['admin', 'staff'].includes(user_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be either "admin" or "staff"'
      });
    }

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ user_type })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

module.exports = {
  getAllUsers,
  updateUser
};