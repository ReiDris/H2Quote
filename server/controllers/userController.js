const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getAllUsers = async (req, res) => {
  try {
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

    if (!user_type || !['admin', 'staff'].includes(user_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be either "admin" or "staff"'
      });
    }

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

const archiveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot archive your own account'
      });
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, status, user_type')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status === 'Suspended') {
      return res.status(400).json({
        success: false,
        message: 'User is already archived'
      });
    }

    const { data: archivedUser, error } = await supabase
      .from('users')
      .update({ 
        status: 'Suspended',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    try {
      await supabase.from('audit_log').insert({
        table_name: 'users',
        record_id: userId,
        action: 'UPDATE',
        old_values: { status: user.status },
        new_values: { status: 'Suspended' },
        changed_by: req.user.email,
        change_reason: `User archived by ${req.user.email}`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    res.json({
      success: true,
      message: 'User archived successfully',
      data: archivedUser
    });

  } catch (error) {
    console.error('Archive user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive user'
    });
  }
};

const getArchivedUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, email, user_type, status, created_at, updated_at')
      .in('user_type', ['admin', 'staff'])
      .eq('status', 'Suspended')
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get archived users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch archived users'
    });
  }
};

const restoreUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('user_id, first_name, last_name, status, user_type')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'Suspended') {
      return res.status(400).json({
        success: false,
        message: 'User is not archived'
      });
    }

    const { data: restoredUser, error } = await supabase
      .from('users')
      .update({ 
        status: 'Active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    try {
      await supabase.from('audit_log').insert({
        table_name: 'users',
        record_id: userId,
        action: 'UPDATE',
        old_values: { status: 'Suspended' },
        new_values: { status: 'Active' },
        changed_by: req.user.email,
        change_reason: `User restored from archive by ${req.user.email}`,
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    res.json({
      success: true,
      message: 'User restored successfully',
      data: restoredUser
    });

  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore user'
    });
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  archiveUser,
  getArchivedUsers,
  restoreUser
};