const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');
const { createNotification } = require('./notificationController');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getInboxMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'recipient_id = $1 AND recipient_deleted = FALSE';
    let queryParams = [userId];
    
    if (type !== 'all') {
      whereClause += ' AND message_type = $2';
      queryParams.push(type);
    }

    const query = `
      SELECT 
        message_id as id,
        sender_name as sender,
        subject,
        SUBSTRING(content, 1, 100) || CASE WHEN LENGTH(content) > 100 THEN '...' ELSE '' END as preview,
        TO_CHAR(sent_at, 'Mon DD') as date,
        sent_at,
        is_read,
        is_starred,
        message_type,
        related_request_id as "requestId",
        sender_company_name as "senderCompany",
        reply_count,
        has_replies
      FROM user_inbox_view
      WHERE ${whereClause}
      ORDER BY sent_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);
    const result = await pool.query(query, queryParams);

    const countQuery = `
      SELECT COUNT(*) FROM messages 
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);

    const messages = result.rows.map(msg => ({
      id: msg.id,
      sender: msg.sender + (msg.senderCompany ? ` (${msg.senderCompany})` : ''),
      subject: msg.subject,
      date: msg.date,
      isRead: msg.is_read,
      isStarred: msg.is_starred,
      requestId: msg.requestId,
      messageType: msg.message_type,
      hasReplies: msg.has_replies,
      replyCount: parseInt(msg.reply_count)
    }));

    res.json({
      success: true,
      data: {
        messages: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get inbox messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
};

const getSentMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        message_id as id,
        recipient_name as recipient,
        subject,
        SUBSTRING(content, 1, 100) || CASE WHEN LENGTH(content) > 100 THEN '...' ELSE '' END as preview,
        TO_CHAR(sent_at, 'Mon DD') as date,
        sent_at,
        is_read,
        message_type,
        related_request_id as "requestId",
        recipient_company_name as "recipientCompany"
      FROM user_sent_view
      WHERE sender_id = $1
      ORDER BY sent_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM messages 
      WHERE sender_id = $1 AND sender_deleted = FALSE
    `, [userId]);
    
    const totalCount = parseInt(countResult.rows[0].count);

    const messages = result.rows.map(msg => ({
      id: msg.id,
      recipient: msg.recipient + (msg.recipientCompany ? ` (${msg.recipientCompany})` : ''),
      subject: msg.subject,
      date: msg.date,
      isRead: msg.is_read,
      requestId: msg.requestId,
      messageType: msg.message_type
    }));

    res.json({
      success: true,
      data: {
        messages: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent messages'
    });
  }
};

const getMessageDetails = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // ✅ FIXED: Changed user_id to p_user_id to match the database function
    const { data: thread, error } = await supabase
      .rpc('get_message_thread', { 
        msg_id: parseInt(messageId), 
        p_user_id: userId  // Changed from user_id to p_user_id
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }

    if (!thread || thread.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied'
      });
    }

    await pool.query('SELECT mark_message_read($1, $2)', [messageId, userId]);

    const originalMessage = thread.find(msg => msg.is_original);
    const replies = thread.filter(msg => !msg.is_original);

    res.json({
      success: true,
      data: {
        message: {
          id: originalMessage.message_id,
          sender: originalMessage.sender_name,
          subject: originalMessage.subject,
          content: originalMessage.content,
          sentAt: originalMessage.sent_at,
          isRead: originalMessage.is_read
        },
        replies: replies.map(reply => ({
          id: reply.message_id,
          sender: reply.sender_name,
          content: reply.content,
          sentAt: reply.sent_at
        }))
      }
    });

  } catch (error) {
    console.error('Get message details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message details'
    });
  }
};

const sendMessage = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      recipientId,
      subject,
      content,
      messageType = 'general',
      relatedRequestId = null
    } = req.body;

    const senderId = req.user.id;

    if (!recipientId || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and content are required'
      });
    }

    // Get recipient details
    const recipientCheck = await client.query(
      'SELECT user_id, email, first_name, last_name FROM users WHERE user_id = $1',
      [recipientId]
    );

    if (recipientCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const recipient = recipientCheck.rows[0];

    const insertQuery = `
      INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, related_request_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING message_id, sent_at
    `;

    const result = await client.query(insertQuery, [
      senderId, recipientId, subject.trim(), content.trim(), messageType, relatedRequestId
    ]);

    await client.query('COMMIT');

    // ✅ SEND EMAIL NOTIFICATION TO RECIPIENT
    try {
      const recipientName = `${recipient.first_name} ${recipient.last_name}`.trim();
      const messagePreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
      
      await createNotification(
        recipientId,
        'New Message',
        `New Message: ${subject}`,
        `You have received a new message from ${req.user.email}. Subject: ${subject}. ${messagePreview}`,
        recipient.email
      );
      
      console.log(`Message notification sent to ${recipient.email}`);
    } catch (notifError) {
      console.error('Failed to send message notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: result.rows[0].message_id,
        sentAt: result.rows[0].sent_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  } finally {
    client.release();
  }
};

const createServiceRequestMessage = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { requestId } = req.params;
    const { subject, content } = req.body;
    const senderId = req.user.id;
    const senderType = req.user.userType;

    // Validate inputs
    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    // Verify the service request exists and the customer owns it
    const requestQuery = `
      SELECT 
        sr.request_id, 
        sr.request_number, 
        sr.requested_by_user_id,
        sr.assigned_to_staff_id,
        u.email as customer_email,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM service_requests sr
      JOIN users u ON sr.requested_by_user_id = u.user_id
      WHERE sr.request_id = $1
    `;
    
    const requestResult = await client.query(requestQuery, [requestId]);
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    const request = requestResult.rows[0];

    // Only allow customer to initiate message
    if (senderType !== 'client') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only customers can initiate service request messages'
      });
    }

    // Verify the customer owns this request
    if (request.requested_by_user_id !== senderId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You can only message about your own service requests'
      });
    }

    // Get all admin and staff users to notify
    const recipientsQuery = `
      SELECT user_id, email, first_name, last_name 
      FROM users 
      WHERE user_type IN ('admin', 'staff') AND status = 'Active'
      ORDER BY 
        CASE 
          WHEN user_id = $1 THEN 0  -- Prioritize assigned staff
          WHEN user_type = 'admin' THEN 1
          ELSE 2
        END
    `;
    
    const recipientsResult = await client.query(recipientsQuery, [request.assigned_to_staff_id]);
    
    if (recipientsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No staff available to receive message'
      });
    }

    // Send message to the first available recipient (assigned staff or first admin)
    const primaryRecipient = recipientsResult.rows[0];

    // Create the message with service request context
    const insertQuery = `
      INSERT INTO messages (
        sender_id, 
        recipient_id, 
        subject, 
        content, 
        message_type, 
        related_request_id
      )
      VALUES ($1, $2, $3, $4, 'service_request', $5)
      RETURNING message_id, sent_at
    `;

    const fullSubject = `[Request #${request.request_number}] ${subject}`;
    const fullContent = `Regarding Service Request: ${request.request_number}\n\n${content}`;

    const messageResult = await client.query(insertQuery, [
      senderId,
      primaryRecipient.user_id,
      fullSubject,
      fullContent,
      requestId
    ]);

    const messageId = messageResult.rows[0].message_id;

    await client.query('COMMIT');

    // ✅ SEND EMAIL NOTIFICATIONS TO ALL ADMIN/STAFF
    try {
      for (const recipient of recipientsResult.rows) {
        const recipientName = `${recipient.first_name} ${recipient.last_name}`.trim();
        const messagePreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
        
        await createNotification(
          recipient.user_id,
          'Service Request Message',
          `Message about Request #${request.request_number}`,
          `${request.customer_name} sent a message about service request #${request.request_number}. Subject: ${subject}. ${messagePreview}`,
          recipient.email
        );
      }
      
      console.log(`✅ Service request message notifications sent to ${recipientsResult.rows.length} staff members`);
    } catch (notifError) {
      console.error('❌ Failed to send message notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully to TRISHKAYE team',
      data: {
        messageId: messageId,
        sentAt: messageResult.rows[0].sent_at,
        recipientCount: recipientsResult.rows.length,
        requestNumber: request.request_number
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create service request message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

const replyToMessage = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    const senderType = req.user.userType;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const originalQuery = `
      SELECT 
        m.sender_id, 
        m.recipient_id, 
        m.subject, 
        m.related_request_id, 
        m.message_type,
        sender.user_type as sender_user_type,
        sender.email as sender_email,
        sender.first_name as sender_first_name,
        sender.last_name as sender_last_name,
        recipient.user_type as recipient_user_type,
        recipient.email as recipient_email,
        recipient.first_name as recipient_first_name,
        recipient.last_name as recipient_last_name,
        sr.request_number
      FROM messages m
      JOIN users sender ON m.sender_id = sender.user_id
      JOIN users recipient ON m.recipient_id = recipient.user_id
      LEFT JOIN service_requests sr ON m.related_request_id = sr.request_id
      WHERE m.message_id = $1 AND (m.sender_id = $2 OR m.recipient_id = $2)
    `;
    
    const originalResult = await client.query(originalQuery, [messageId, senderId]);
    
    if (originalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found or access denied'
      });
    }

    const original = originalResult.rows[0];

    // ✅ IMPORTANT: Restrict replies for service_request messages
    if (original.message_type === 'service_request') {
      // Only allow admin/staff to reply to customer messages
      if (senderType === 'client') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'Customers cannot reply to service request messages. Please create a new message instead.'
        });
      }

      // Verify staff/admin is replying to a customer message
      if (original.sender_user_type !== 'client') {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          message: 'Can only reply to customer messages'
        });
      }
    }

    const replyRecipient = original.sender_id === senderId ? original.recipient_id : original.sender_id;
    const replySubject = original.subject.startsWith('Re: ') ? original.subject : `Re: ${original.subject}`;

    // Determine recipient details (who will receive this reply)
    let recipientEmail, recipientFirstName, recipientLastName;
    if (replyRecipient === original.sender_id) {
      recipientEmail = original.sender_email;
      recipientFirstName = original.sender_first_name;
      recipientLastName = original.sender_last_name;
    } else {
      recipientEmail = original.recipient_email;
      recipientFirstName = original.recipient_first_name;
      recipientLastName = original.recipient_last_name;
    }

    const replyQuery = `
      INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, related_request_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING message_id, sent_at
    `;

    const replyResult = await client.query(replyQuery, [
      senderId, replyRecipient, replySubject, content.trim(), 
      original.message_type, original.related_request_id
    ]);

    const replyId = replyResult.rows[0].message_id;

    await client.query(`
      INSERT INTO message_replies (original_message_id, reply_message_id)
      VALUES ($1, $2)
    `, [messageId, replyId]);

    await client.query('COMMIT');

    // ✅ SEND EMAIL NOTIFICATION TO RECIPIENT (Customer or Staff)
    try {
      const recipientName = `${recipientFirstName} ${recipientLastName}`.trim();
      const replyPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
      const senderName = req.user.email; // You can also use req.user first/last name if available
      
      // Different notification based on recipient type and message type
      let notificationTitle, notificationBody;
      
      if (original.message_type === 'service_request') {
        // For service request messages - customer receiving reply
        notificationTitle = `Response to Your Service Request Message`;
        notificationBody = `TRISHKAYE team replied to your message about Service Request #${original.request_number}.

Subject: ${replySubject}

${replyPreview}

Please log in to view and respond: ${process.env.FRONTEND_URL || 'https://h2-quote.vercel.app'}/customer/messages`;
      } else {
        // For general messages
        notificationTitle = `New Reply: ${replySubject}`;
        notificationBody = `${senderName} replied to your message.

${replyPreview}

Please log in to view the full conversation: ${process.env.FRONTEND_URL || 'https://h2-quote.vercel.app'}/messages`;
      }

      await createNotification(
        replyRecipient,
        'Message Reply',
        notificationTitle,
        notificationBody,
        recipientEmail
      );
      
      console.log(`✅ Reply notification sent to ${recipientEmail} (${recipientName})`);
    } catch (notifError) {
      console.error('❌ Failed to send reply notification:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        messageId: replyId,
        sentAt: replyResult.rows[0].sent_at,
        recipientEmail: recipientEmail,
        recipientName: `${recipientFirstName} ${recipientLastName}`
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reply to message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  } finally {
    client.release();
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query('SELECT get_user_unread_count($1) as count', [userId]);
    const unreadCount = result.rows[0]?.count || 0;

    res.json({
      success: true,
      data: {
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body; 
    const userId = req.user.id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    const query = `
      UPDATE messages 
      SET is_read = TRUE, read_at = NOW()
      WHERE message_id = ANY($1) 
        AND recipient_id = $2 
        AND is_read = FALSE
    `;

    const result = await pool.query(query, [messageIds, userId]);

    res.json({
      success: true,
      message: `${result.rowCount} message(s) marked as read`
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

const deleteMessages = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    const query = `
      UPDATE messages 
      SET sender_deleted = CASE WHEN sender_id = $2 THEN TRUE ELSE sender_deleted END,
          recipient_deleted = CASE WHEN recipient_id = $2 THEN TRUE ELSE recipient_deleted END
      WHERE message_id = ANY($1) 
        AND (sender_id = $2 OR recipient_id = $2)
    `;

    const result = await pool.query(query, [messageIds, userId]);

    res.json({
      success: true,
      message: `${result.rowCount} message(s) deleted`
    });

  } catch (error) {
    console.error('Delete messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete messages'
    });
  }
};

const getMessageableUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    let query;
    let queryParams = [userId];

    if (userType === 'client') {
      query = `
        SELECT user_id as id, CONCAT(first_name, ' ', last_name) as name, 
               user_type, department
        FROM users 
        WHERE user_type IN ('admin', 'staff') AND user_id != $1 AND status = 'Active'
        ORDER BY user_type, last_name
      `;
    } else {
      query = `
        SELECT u.user_id as id, CONCAT(u.first_name, ' ', u.last_name) as name, 
               u.user_type, u.department, c.company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.company_id
        WHERE u.user_id != $1 AND u.status = 'Active'
        ORDER BY u.user_type, c.company_name, u.last_name
      `;
    }

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get messageable users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

module.exports = {
  getInboxMessages,
  getSentMessages,
  getMessageDetails,
  sendMessage,
  replyToMessage,
  getUnreadCount,
  markAsRead,
  deleteMessages,
  getMessageableUsers,
  createServiceRequestMessage  
};