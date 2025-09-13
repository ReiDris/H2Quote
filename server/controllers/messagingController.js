// controllers/simplifiedMessagingController.js
const pool = require('../config/database');

// Get user's inbox messages (what your frontend expects)
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

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM messages 
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);

    // Format data to match your frontend expectations
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

// Get sent messages
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

    // Get total count
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

// Get single message details with thread
const getMessageDetails = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Get message thread (original + replies)
    const { data: thread, error } = await supabase
      .rpc('get_message_thread', { 
        msg_id: parseInt(messageId), 
        user_id: userId 
      });

    if (error) {
      throw error;
    }

    if (!thread || thread.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or access denied'
      });
    }

    // Mark original message as read if user is recipient
    await pool.query('SELECT mark_message_read($1, $2)', [messageId, userId]);

    // Separate original message and replies
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

// Send new message
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

    // Validate required fields
    if (!recipientId || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and content are required'
      });
    }

    // Verify recipient exists
    const recipientCheck = await client.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [recipientId]
    );

    if (recipientCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Insert message
    const insertQuery = `
      INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, related_request_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING message_id, sent_at
    `;

    const result = await client.query(insertQuery, [
      senderId, recipientId, subject.trim(), content.trim(), messageType, relatedRequestId
    ]);

    await client.query('COMMIT');

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

// Reply to message
const replyToMessage = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    // Get original message details
    const originalQuery = `
      SELECT sender_id, recipient_id, subject, related_request_id, message_type
      FROM messages 
      WHERE message_id = $1 AND (sender_id = $2 OR recipient_id = $2)
    `;
    
    const originalResult = await client.query(originalQuery, [messageId, senderId]);
    
    if (originalResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found or access denied'
      });
    }

    const original = originalResult.rows[0];
    
    // Determine reply recipient (if sender is replying, send to original recipient, vice versa)
    const replyRecipient = original.sender_id === senderId ? original.recipient_id : original.sender_id;
    const replySubject = original.subject.startsWith('Re: ') ? original.subject : `Re: ${original.subject}`;

    // Insert reply message
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

    // Link reply to original message
    await client.query(`
      INSERT INTO message_replies (original_message_id, reply_message_id)
      VALUES ($1, $2)
    `, [messageId, replyId]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        messageId: replyId,
        sentAt: replyResult.rows[0].sent_at
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

// Get unread count
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

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body; // Array of message IDs
    const userId = req.user.id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    // Mark messages as read
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

// Delete messages
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

    // Soft delete - mark as deleted for the user
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

// Get list of users to message (for compose)
const getMessageableUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    let query;
    let queryParams = [userId];

    if (userType === 'client') {
      // Clients can only message admin/staff
      query = `
        SELECT user_id as id, CONCAT(first_name, ' ', last_name) as name, 
               user_type, department
        FROM users 
        WHERE user_type IN ('admin', 'staff') AND user_id != $1
        ORDER BY user_type, last_name
      `;
    } else {
      // Admin/staff can message anyone
      query = `
        SELECT u.user_id as id, CONCAT(u.first_name, ' ', u.last_name) as name, 
               u.user_type, u.department, c.company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.company_id
        WHERE u.user_id != $1
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
  getMessageableUsers
};