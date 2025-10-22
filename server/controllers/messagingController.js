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
      WHERE sender_id = $1 AND sender_deleted = FALSE
      ORDER BY sent_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    const countQuery = `
      SELECT COUNT(*) FROM messages 
      WHERE sender_id = $1 AND sender_deleted = FALSE
    `;
    const countResult = await pool.query(countQuery, [userId]);
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

    const query = `
      SELECT 
        m.message_id,
        m.sender_id,
        m.recipient_id,
        m.subject,
        m.content,
        m.message_type,
        m.is_read,
        m.is_starred,
        m.sent_at,
        m.related_request_id,
        sender.first_name || ' ' || sender.last_name as sender_name,
        sender.email as sender_email,
        recipient.first_name || ' ' || recipient.last_name as recipient_name,
        recipient.email as recipient_email,
        sender_company.company_name as sender_company,
        recipient_company.company_name as recipient_company
      FROM messages m
      JOIN users sender ON m.sender_id = sender.user_id
      JOIN users recipient ON m.recipient_id = recipient.user_id
      LEFT JOIN companies sender_company ON sender.company_id = sender_company.company_id
      LEFT JOIN companies recipient_company ON recipient.company_id = recipient_company.company_id
      WHERE m.message_id = $1 
        AND (m.sender_id = $2 OR m.recipient_id = $2)
        AND ((m.sender_id = $2 AND NOT m.sender_deleted) OR (m.recipient_id = $2 AND NOT m.recipient_deleted))
    `;

    const result = await pool.query(query, [messageId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const message = result.rows[0];

    if (message.recipient_id === userId && !message.is_read) {
      await pool.query(
        'UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE message_id = $1',
        [messageId]
      );
    }

    const repliesQuery = `
      SELECT 
        m.message_id,
        m.content,
        m.sent_at,
        m.sender_id,
        sender.first_name || ' ' || sender.last_name as sender_name,
        sender.user_type
      FROM messages m
      JOIN message_replies mr ON m.message_id = mr.reply_message_id
      JOIN users sender ON m.sender_id = sender.user_id
      WHERE mr.original_message_id = $1
      ORDER BY m.sent_at ASC
    `;

    const repliesResult = await pool.query(repliesQuery, [messageId]);

    res.json({
      success: true,
      data: {
        id: message.message_id,
        subject: message.subject,
        content: message.content,
        sender: {
          id: message.sender_id,
          name: message.sender_name,
          email: message.sender_email,
          company: message.sender_company
        },
        recipient: {
          id: message.recipient_id,
          name: message.recipient_name,
          email: message.recipient_email,
          company: message.recipient_company
        },
        sentAt: message.sent_at,
        isRead: message.is_read,
        isStarred: message.is_starred,
        messageType: message.message_type,
        relatedRequestId: message.related_request_id,
        replies: repliesResult.rows.map(reply => ({
          id: reply.message_id,
          content: reply.content,
          sentAt: reply.sent_at,
          senderId: reply.sender_id,
          senderName: reply.sender_name,
          senderType: reply.user_type
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
      'SELECT user_id, email, first_name, last_name, user_type FROM users WHERE user_id = $1',
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

    const messageId = result.rows[0].message_id;

    // ✅ ADD AUDIT LOG for message sent
    try {
      await supabase.from('audit_log').insert({
        table_name: 'messages',
        record_id: messageId,
        action: 'CREATE',
        new_values: {
          message_sent: true,
          recipient_id: recipientId,
          recipient_name: `${recipient.first_name} ${recipient.last_name}`,
          recipient_type: recipient.user_type,
          subject: subject.trim(),
          message_type: messageType,
          related_request_id: relatedRequestId
        },
        changed_by: req.user.email,
        change_reason: `Message sent to ${recipient.user_type}: ${recipient.first_name} ${recipient.last_name}`,
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

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
        messageId: messageId,
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

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

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

    if (senderType !== 'client') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Only customers can initiate service request messages'
      });
    }

    if (request.requested_by_user_id !== senderId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You can only message about your own service requests'
      });
    }

    const recipientsQuery = `
      SELECT user_id, email, first_name, last_name 
      FROM users 
      WHERE user_type IN ('admin', 'staff') AND status = 'Active'
      ORDER BY 
        CASE 
          WHEN user_id = $1 THEN 0
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

    const primaryRecipient = recipientsResult.rows[0];

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

    const result = await client.query(insertQuery, [
      senderId,
      primaryRecipient.user_id,
      `[SR #${request.request_number}] ${subject}`,
      content.trim(),
      requestId
    ]);

    const messageId = result.rows[0].message_id;

    // ✅ ADD AUDIT LOG for service request message
    try {
      await supabase.from('audit_log').insert({
        table_name: 'messages',
        record_id: messageId,
        action: 'CREATE',
        new_values: {
          message_sent: true,
          service_request_message: true,
          request_number: request.request_number,
          request_id: requestId,
          recipient_staff: `${primaryRecipient.first_name} ${primaryRecipient.last_name}`,
          subject: subject.trim()
        },
        changed_by: req.user.email,
        change_reason: `Customer messaged staff about service request #${request.request_number}`,
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    await client.query('COMMIT');

    // Notify all admin/staff
    try {
      for (const recipient of recipientsResult.rows) {
        await createNotification(
          recipient.user_id,
          'Service Request',
          `New Message on SR #${request.request_number}`,
          `Customer ${request.customer_name} sent a message about service request #${request.request_number}. Subject: ${subject}`,
          recipient.email
        );
      }
      console.log(`Service request message notifications sent to ${recipientsResult.rows.length} staff members`);
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent to staff successfully',
      data: {
        messageId: messageId,
        sentAt: result.rows[0].sent_at,
        requestNumber: request.request_number
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create service request message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
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

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const originalQuery = `
      SELECT 
        m.message_id,
        m.subject,
        m.sender_id,
        m.recipient_id,
        m.related_request_id,
        m.message_type,
        sender.first_name as sender_first_name,
        sender.last_name as sender_last_name,
        sender.email as sender_email,
        recipient.first_name as recipient_first_name,
        recipient.last_name as recipient_last_name,
        recipient.email as recipient_email
      FROM messages m
      JOIN users sender ON m.sender_id = sender.user_id
      JOIN users recipient ON m.recipient_id = recipient.user_id
      WHERE m.message_id = $1
    `;

    const originalResult = await client.query(originalQuery, [messageId]);

    if (originalResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Original message not found'
      });
    }

    const original = originalResult.rows[0];

    if (original.sender_id !== senderId && original.recipient_id !== senderId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You can only reply to messages you are part of'
      });
    }

    const recipientId = original.sender_id === senderId 
      ? original.recipient_id 
      : original.sender_id;

    const recipientFirstName = original.sender_id === senderId 
      ? original.recipient_first_name 
      : original.sender_first_name;
    
    const recipientLastName = original.sender_id === senderId 
      ? original.recipient_last_name 
      : original.sender_last_name;

    const recipientEmail = original.sender_id === senderId 
      ? original.recipient_email 
      : original.sender_email;

    const replySubject = original.subject.startsWith('Re: ') 
      ? original.subject 
      : `Re: ${original.subject}`;

    const insertReplyQuery = `
      INSERT INTO messages (
        sender_id,
        recipient_id,
        subject,
        content,
        message_type,
        related_request_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING message_id, sent_at
    `;

    const replyResult = await client.query(insertReplyQuery, [
      senderId,
      recipientId,
      replySubject,
      content.trim(),
      original.message_type,
      original.related_request_id
    ]);

    const replyId = replyResult.rows[0].message_id;

    await client.query(
      `INSERT INTO message_replies (original_message_id, reply_message_id) VALUES ($1, $2)`,
      [messageId, replyId]
    );

    // ✅ ADD AUDIT LOG for message reply
    try {
      await supabase.from('audit_log').insert({
        table_name: 'messages',
        record_id: replyId,
        action: 'CREATE',
        new_values: {
          message_reply: true,
          original_message_id: messageId,
          recipient_id: recipientId,
          recipient_name: `${recipientFirstName} ${recipientLastName}`,
          subject: replySubject
        },
        changed_by: req.user.email,
        change_reason: `Replied to message: ${original.subject}`,
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    await client.query('COMMIT');

    try {
      const recipientName = `${recipientFirstName} ${recipientLastName}`.trim();
      const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;
      
      await createNotification(
        recipientId,
        'New Message',
        `Reply to: ${original.subject}`,
        `You have received a reply from ${req.user.email}. ${contentPreview}`,
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
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { messageIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    // Get message details before deletion for audit log
    const messageQuery = `
      SELECT 
        m.message_id,
        m.subject,
        m.sender_id,
        m.recipient_id,
        CONCAT(sender.first_name, ' ', sender.last_name) as sender_name,
        CONCAT(recipient.first_name, ' ', recipient.last_name) as recipient_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.user_id
      JOIN users recipient ON m.recipient_id = recipient.user_id
      WHERE m.message_id = ANY($1) AND (m.sender_id = $2 OR m.recipient_id = $2)
    `;
    
    const messagesResult = await client.query(messageQuery, [messageIds, userId]);

    const query = `
      UPDATE messages 
      SET sender_deleted = CASE WHEN sender_id = $2 THEN TRUE ELSE sender_deleted END,
          recipient_deleted = CASE WHEN recipient_id = $2 THEN TRUE ELSE recipient_deleted END
      WHERE message_id = ANY($1) 
        AND (sender_id = $2 OR recipient_id = $2)
    `;

    const result = await client.query(query, [messageIds, userId]);

    // ✅ ADD AUDIT LOG for message deletion
    try {
      for (const message of messagesResult.rows) {
        const isSender = message.sender_id === userId;
        await supabase.from('audit_log').insert({
          table_name: 'messages',
          record_id: message.message_id,
          action: 'DELETE',
          new_values: {
            message_deleted: true,
            deleted_by_role: isSender ? 'sender' : 'recipient',
            subject: message.subject,
            other_party: isSender ? message.recipient_name : message.sender_name
          },
          changed_by: req.user.email,
          change_reason: `Message deleted by ${isSender ? 'sender' : 'recipient'}`,
          ip_address: req.ip || req.connection.remoteAddress,
        });
      }
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${result.rowCount} message(s) deleted`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete messages'
    });
  } finally {
    client.release();
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