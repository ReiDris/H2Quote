const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get notifications for logged-in user
const getUserNotifications = async (req, res) => {
  try {
    console.log('getUserNotifications called');
    console.log('User ID:', req.user?.id);
    console.log('User email:', req.user?.email);
    
    const userId = req.user.id;
    const { limit = 20, unreadOnly = false } = req.query;

    console.log('Query params:', { limit, unreadOnly });

    let query = `
      SELECT 
        notification_id,
        notification_type,
        subject,
        message_body,
        status,
        created_at,
        sent_at,
        CASE 
          WHEN sent_at IS NOT NULL THEN false
          ELSE true
        END as is_unread
      FROM notifications
      WHERE recipient_user_id = $1
    `;

    const queryParams = [userId];

    if (unreadOnly === 'true') {
      query += ' AND sent_at IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT $2';
    queryParams.push(parseInt(limit));

    console.log('Executing query with params:', queryParams);

    const result = await pool.query(query, queryParams);

    console.log('Found notifications:', result.rows.length);

    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = $1 AND sent_at IS NULL',
      [userId]
    );

    console.log('Unread count:', unreadResult.rows[0].count);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unreadCount: parseInt(unreadResult.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE notifications 
       SET sent_at = NOW(), status = 'Sent'
       WHERE notification_id = $1 AND recipient_user_id = $2
       RETURNING notification_id`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications 
       SET sent_at = NOW(), status = 'Sent'
       WHERE recipient_user_id = $1 AND sent_at IS NULL`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Helper function to create notification
const createNotification = async (userId, notificationType, subject, messageBody, recipientEmail = null) => {
  try {
    const query = `
      INSERT INTO notifications 
      (notification_type, recipient_type, recipient_user_id, recipient_email, subject, message_body, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending')
      RETURNING notification_id
    `;

    const recipientType = userId ? 'Internal' : 'External';

    const result = await pool.query(query, [
      notificationType,
      recipientType,
      userId,
      recipientEmail,
      subject,
      messageBody
    ]);

    return result.rows[0].notification_id;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};