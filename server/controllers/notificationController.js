const { createClient } = require("@supabase/supabase-js");
const pool = require("../config/database");
const { sendEmail } = require("../emailServices/emailService");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, unreadOnly } = req.query;

    const isUnreadOnly = unreadOnly === "true" || unreadOnly === true;

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

    if (isUnreadOnly) {
      query += " AND status != $2";
      queryParams.push("Sent");
    } else {
    }

    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1}`;
    queryParams.push(parseInt(limit));

    const result = await pool.query(query, queryParams);

    const unreadResult = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = $1 AND status != $2",
      [userId, "Sent"]
    );

    let filteredCountQuery =
      "SELECT COUNT(*) as count FROM notifications WHERE recipient_user_id = $1";
    const filteredCountParams = [userId];

    if (isUnreadOnly) {
      filteredCountQuery += " AND status != $2";
      filteredCountParams.push("Sent");
    }

    const filteredCountResult = await pool.query(
      filteredCountQuery,
      filteredCountParams
    );

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unreadCount: parseInt(unreadResult.rows[0].count),
        filteredCount: parseInt(filteredCountResult.rows[0].count),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

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
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE notifications 
       SET sent_at = NOW(), status = 'Sent'
       WHERE recipient_user_id = $1 AND status != 'Sent'
       RETURNING notification_id`,
      [userId]
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      markedCount: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

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
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

const clearReadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM notifications 
       WHERE recipient_user_id = $1 AND status = 'Sent'
       RETURNING notification_id`,
      [userId]
    );

    res.json({
      success: true,
      message: `${result.rows.length} read notification(s) cleared successfully`,
      deletedCount: result.rows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear read notifications",
    });
  }
};

const generateNotificationEmail = (
  userName,
  subject,
  messageBody,
  notificationType
) => {
  const typeColors = {
    "Account Registration": "#007bff",
    "Account Verification": "#17a2b8",
    "Account Approved": "#28a745",
    "Account Rejected": "#dc3545",
    "Service Request": "#6f42c1",
    "Quote Sent": "#fd7e14",
    "Quote Approved": "#28a745",
    Payment: "#20c997",
    "Status Update": "#6c757d",
  };

  const color = typeColors[notificationType] || "#007bff";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid ${color};">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">${subject}</h2>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">${notificationType}</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #555; line-height: 1.6; margin: 0;">
            ${messageBody.replace(/\n/g, "<br>")}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/notifications" 
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

const createNotification = async (
  userId,
  notificationType,
  subject,
  messageBody,
  recipientEmail = null
) => {
  try {

    if (!userId && !recipientEmail) {
      throw new Error("Either userId or recipientEmail must be provided");
    }

    if (!notificationType || !subject || !messageBody) {
      throw new Error(
        "notificationType, subject, and messageBody are required"
      );
    }

    const recipientType = userId ? "Internal" : "External";

    let finalRecipientEmail = recipientEmail;
    let userName = "User";

    if (userId && !recipientEmail) {
      const userResult = await pool.query(
        "SELECT email, first_name, last_name FROM users WHERE user_id = $1",
        [userId]
      );

      if (userResult.rows.length > 0) {
        finalRecipientEmail = userResult.rows[0].email;
        userName =
          `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`.trim();
      }
    }

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
      messageBody,
    ]);

    const notificationId = result.rows[0].notification_id;

    if (finalRecipientEmail) {
      setImmediate(async () => {
        try {
          const emailSubject = `[H2Quote] ${subject}`;
          const emailHtml = generateNotificationEmail(
            userName,
            subject,
            messageBody,
            notificationType
          );

          const emailSent = await sendEmail(
            finalRecipientEmail,
            emailSubject,
            emailHtml
          );

          if (emailSent) {
            await pool.query(
              `UPDATE notifications 
               SET sent_at = NOW()
               WHERE notification_id = $1`,
              [notificationId]
            );
          } else {
            await pool.query(
              `UPDATE notifications 
               SET status = 'Failed', retry_count = retry_count + 1
               WHERE notification_id = $1`,
              [notificationId]
            );
          }
        } catch (emailError) {

          try {
            await pool.query(
              `UPDATE notifications 
               SET status = 'Failed', retry_count = retry_count + 1
               WHERE notification_id = $1`,
              [notificationId]
            );
          } catch (updateError) {
          }
        }
      });
    }

    return notificationId;
  } catch (error) {
    throw error;
  }
};

const createBulkNotifications = async (
  userIds,
  notificationType,
  subject,
  messageBody
) => {
  try {
    const notificationIds = [];

    for (const userId of userIds) {
      const notificationId = await createNotification(
        userId,
        notificationType,
        subject,
        messageBody
      );
      notificationIds.push(notificationId);
    }

    return notificationIds;
  } catch (error) {
    throw error;
  }
};

const createServiceRequestNotification = async (
  userId,
  requestNumber,
  requestId,
  status,
  customMessage
) => {
  try {
    const notificationType = "Service Request";
    const subject = `Service Request Update - ${requestNumber}`;
    const messageBody =
      customMessage ||
      `Your service request #${requestNumber} has been updated. Status: ${status}`;

    return await createNotification(
      userId,
      notificationType,
      subject,
      messageBody
    );
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  createNotification,
  createBulkNotifications,
  createServiceRequestNotification,
};