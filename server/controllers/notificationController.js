const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');
const { sendEmail } = require('../emailServices/emailService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get notifications for logged-in user
const getUserNotifications = async (req, res) => {
  try {
    console.log('getUserNotifications called');
    console.log('User ID:', req.user?.id);
    console.log('User Type:', req.user?.userType);
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
          WHEN status = 'Sent' THEN false
          ELSE true
        END as is_unread
      FROM notifications
      WHERE recipient_user_id = $1
    `;

    const queryParams = [userId];

    if (unreadOnly === 'true') {
      query += ' AND status = \'Pending\'';
    }

    query += ' ORDER BY created_at DESC LIMIT $2';
    queryParams.push(parseInt(limit));

    console.log('Executing query with params:', queryParams);

    const result = await pool.query(query, queryParams);

    console.log('Found notifications:', result.rows.length);

    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = $1 AND status = $2',
      [userId, 'Pending']
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
       WHERE recipient_user_id = $1 AND status = 'Pending'`,
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

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM notifications 
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
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Generate notification email HTML
const generateNotificationEmail = (userName, subject, messageBody, notificationType) => {
  // Map notification types to colors
  const typeColors = {
    'Account Registration': '#007bff',
    'Account Verification': '#17a2b8',
    'Account Approved': '#28a745',
    'Account Rejected': '#dc3545',
    'Service Request': '#6f42c1',
    'Quote Sent': '#fd7e14',
    'Quote Approved': '#28a745',
    'Payment': '#20c997',
    'Status Update': '#6c757d'
  };

  const color = typeColors[notificationType] || '#007bff';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid ${color};">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">${subject}</h2>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">${notificationType}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6; margin: 0;">
            ${messageBody.replace(/\n/g, '<br>')}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notifications" 
             style="background-color: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View All Notifications
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #888; font-size: 14px; margin: 0;">
            Best regards,<br>
            TRISHKAYE Enterprises
          </p>
          <p style="color: #aaa; font-size: 12px; margin-top: 10px;">
            This is an automated notification from H2Quote
          </p>
        </div>
      </div>
    </div>
  `;
};

// Helper function to create notification (in-app + email)
const createNotification = async (userId, notificationType, subject, messageBody, recipientEmail = null) => {
  try {
    console.log('Creating notification for user:', userId, 'Type:', notificationType);
    
    // Validate required parameters
    if (!userId && !recipientEmail) {
      throw new Error('Either userId or recipientEmail must be provided');
    }

    if (!notificationType || !subject || !messageBody) {
      throw new Error('notificationType, subject, and messageBody are required');
    }

    const recipientType = userId ? 'Internal' : 'External';

    // Get user details if userId is provided and email is not
    let finalRecipientEmail = recipientEmail;
    let userName = 'User';

    if (userId && !recipientEmail) {
      const userResult = await pool.query(
        'SELECT email, first_name, last_name FROM users WHERE user_id = $1',
        [userId]
      );
      
      if (userResult.rows.length > 0) {
        finalRecipientEmail = userResult.rows[0].email;
        userName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`.trim();
      }
    }

    console.log('Final recipient email:', finalRecipientEmail);

    // Insert notification into database
    const query = `
      INSERT INTO notifications 
      (notification_type, recipient_type, recipient_user_id, recipient_email, subject, message_body, status, scheduled_for)
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending', NOW())
      RETURNING notification_id
    `;

    const result = await pool.query(query, [
      notificationType,
      recipientType,
      userId,
      finalRecipientEmail,
      subject,
      messageBody
    ]);

    const notificationId = result.rows[0].notification_id;
    console.log('Notification created with ID:', notificationId);

    // Send email notification asynchronously (don't wait for it)
    if (finalRecipientEmail) {
      setImmediate(async () => {
        try {
          const emailSubject = `[H2Quote] ${subject}`;
          const emailHtml = generateNotificationEmail(userName, subject, messageBody, notificationType);
          
          const emailSent = await sendEmail(finalRecipientEmail, emailSubject, emailHtml);
          
          // Update notification status
          if (emailSent) {
            await pool.query(
              `UPDATE notifications 
               SET status = 'Sent', sent_at = NOW()
               WHERE notification_id = $1`,
              [notificationId]
            );
            console.log('Email notification sent successfully to:', finalRecipientEmail);
          } else {
            await pool.query(
              `UPDATE notifications 
               SET status = 'Failed', retry_count = retry_count + 1
               WHERE notification_id = $1`,
              [notificationId]
            );
            console.error('Failed to send email notification to:', finalRecipientEmail);
          }
        } catch (emailError) {
          console.error('Error sending notification email:', emailError);
          // Update failed status
          try {
            await pool.query(
              `UPDATE notifications 
               SET status = 'Failed', retry_count = retry_count + 1
               WHERE notification_id = $1`,
              [notificationId]
            );
          } catch (updateError) {
            console.error('Error updating notification status:', updateError);
          }
        }
      });
    }

    return notificationId;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Helper function to create notifications for multiple users
const createBulkNotifications = async (userIds, notificationType, subject, messageBody) => {
  try {
    const notificationIds = [];
    
    for (const userId of userIds) {
      const notificationId = await createNotification(userId, notificationType, subject, messageBody);
      notificationIds.push(notificationId);
    }
    
    return notificationIds;
  } catch (error) {
    console.error('Create bulk notifications error:', error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createBulkNotifications
};