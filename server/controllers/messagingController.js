const { createClient } = require("@supabase/supabase-js");
const pool = require("../config/database");
const { createNotification } = require("./notificationController");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getInboxMessages = async (req, res) => {
  const userId = req.user.id; // Move outside try block
  const userType = req.user.userType; // Move outside try block

  try {
    const { type = "all", page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause;
    let queryParams;
    let countQueryParams;

    if (userType === "admin") {
      // Admin sees ALL original messages (not replies) in the system
      whereClause = `
        NOT EXISTS (
          SELECT 1 FROM message_replies mr 
          WHERE mr.reply_message_id = m.message_id
        )
      `;
      queryParams = [];
      countQueryParams = [];
    } else if (userType === "staff") {
      // Staff only see messages related to service requests assigned to them
      whereClause = `
        NOT EXISTS (
          SELECT 1 FROM message_replies mr 
          WHERE mr.reply_message_id = m.message_id
        )
        AND (
          m.related_request_id IN (
            SELECT request_id FROM service_requests WHERE assigned_to_staff_id = $1
          )
          OR m.sender_id = $1
          OR m.recipient_id = $1
        )
      `;
      queryParams = [userId];
      countQueryParams = [userId];
    } else {
      // Customers see messages where they are EITHER sender OR recipient
      whereClause = `
        (m.recipient_id = $1 OR m.sender_id = $1)
        AND (
          (m.recipient_id = $1 AND m.recipient_deleted = FALSE) OR 
          (m.sender_id = $1 AND m.sender_deleted = FALSE)
        )
        AND NOT EXISTS (
          SELECT 1 FROM message_replies mr 
          WHERE mr.reply_message_id = m.message_id
        )
      `;
      queryParams = [userId];
      countQueryParams = [userId];
    }

    if (type !== "all") {
      const paramIndex = queryParams.length + 1;
      whereClause += ` AND m.message_type = $${paramIndex}`;
      queryParams.push(type);
      countQueryParams.push(type);
    }

    // Calculate pagination parameter positions
    const limitParamIndex = queryParams.length + 1;
    const offsetParamIndex = queryParams.length + 2;

    // For admin, we need to add userId for the read status check
    let readStatusUserParam;
    if (userType === "admin") {
      readStatusUserParam = limitParamIndex; // Will be added before limit/offset
    } else {
      readStatusUserParam = 1; // For customers and staff, userId is already param $1
    }

    const query = `
      WITH message_stats AS (
        SELECT 
          m.message_id,
          COUNT(mr.reply_id) as reply_count,
          CASE WHEN COUNT(mr.reply_id) > 0 THEN true ELSE false END as has_replies
        FROM messages m
        LEFT JOIN message_replies mr ON m.message_id = mr.original_message_id
        GROUP BY m.message_id
      )
      SELECT 
        m.message_id as id,
        ${
          userType === "admin"
            ? `sender.first_name || ' ' || sender.last_name`
            : `CASE 
                WHEN m.sender_id = $1 THEN recipient.first_name || ' ' || recipient.last_name
                ELSE sender.first_name || ' ' || sender.last_name
              END`
        } as sender,
        m.subject,
        SUBSTRING(m.content, 1, 100) || CASE WHEN LENGTH(m.content) > 100 THEN '...' ELSE '' END as preview,
        TO_CHAR(m.sent_at, 'Mon DD') as date,
        m.sent_at,
        CASE WHEN mrs.user_id IS NOT NULL THEN true ELSE false END as is_read,
        m.is_starred,
        m.message_type,
        m.related_request_id as "requestId",
        ${
          userType === "admin"
            ? `sender_company.company_name`
            : `CASE 
                WHEN m.sender_id = $1 THEN recipient_company.company_name
                ELSE sender_company.company_name
              END`
        } as "senderCompany",
        COALESCE(ms.reply_count, 0) as reply_count,
        COALESCE(ms.has_replies, false) as has_replies
      FROM messages m
      JOIN users sender ON m.sender_id = sender.user_id
      JOIN users recipient ON m.recipient_id = recipient.user_id
      LEFT JOIN companies sender_company ON sender.company_id = sender_company.company_id
      LEFT JOIN companies recipient_company ON recipient.company_id = recipient_company.company_id
      LEFT JOIN message_stats ms ON m.message_id = ms.message_id
      LEFT JOIN message_read_status mrs ON m.message_id = mrs.message_id AND mrs.user_id = $${readStatusUserParam}
      WHERE ${whereClause}
      ORDER BY m.sent_at DESC
      LIMIT $${limitParamIndex + (userType === "admin" ? 1 : 0)} OFFSET $${
      offsetParamIndex + (userType === "admin" ? 1 : 0)
    }
    `;

    // Add userId to queryParams for admin (for the read status check)
    if (userType === "admin") {
      queryParams.push(userId);
    }

    // Add pagination params
    queryParams.push(limit, offset);

    console.log("User type:", userType);
    console.log("Query params:", queryParams);
    console.log("Count query params:", countQueryParams);

    const result = await pool.query(query, queryParams);

    // Count query
    const countQuery = `
      SELECT COUNT(*) FROM messages m
      WHERE ${whereClause}
    `;

    const countResult = await pool.query(countQuery, countQueryParams);
    const totalCount = parseInt(countResult.rows[0].count);

    const messages = result.rows.map((msg) => ({
      id: msg.id,
      sender: msg.sender + (msg.senderCompany ? ` (${msg.senderCompany})` : ""),
      subject: msg.subject,
      date: msg.date,
      isRead: msg.is_read,
      isStarred: msg.is_starred,
      requestId: msg.requestId,
      messageType: msg.message_type,
      hasReplies: msg.has_replies,
      replyCount: parseInt(msg.reply_count),
    }));

    res.json({
      success: true,
      data: {
        messages: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get inbox messages error:", error);
    console.error("Error details:", {
      message: error.message,
      userType: userType,
      userId: userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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

    const messages = result.rows.map((msg) => ({
      id: msg.id,
      recipient:
        msg.recipient +
        (msg.recipientCompany ? ` (${msg.recipientCompany})` : ""),
      subject: msg.subject,
      date: msg.date,
      isRead: msg.is_read,
      requestId: msg.requestId,
      messageType: msg.message_type,
    }));

    res.json({
      success: true,
      data: {
        messages: messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get sent messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sent messages",
    });
  }
};

const getMessageDetails = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    // Admin/Staff can view any message, customers only their own
    let accessCheck = "(m.sender_id = $2 OR m.recipient_id = $2)";
    if (userType === "admin" || userType === "staff") {
      accessCheck = "1=1"; // Allow all access
    }

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
        AND ${accessCheck}
        AND ((m.sender_id = $2 AND NOT m.sender_deleted) OR (m.recipient_id = $2 AND NOT m.recipient_deleted) OR $3)
    `;

    const isAdminOrStaff = userType === "admin" || userType === "staff";
    const result = await pool.query(query, [messageId, userId, isAdminOrStaff]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const message = result.rows[0];

    // Mark as read if recipient is viewing
    if (message.recipient_id === userId && !message.is_read) {
      await pool.query(
        "UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE message_id = $1",
        [messageId]
      );
    }

    // Get replies
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

    // Format response to match frontend expectations
    res.json({
      success: true,
      data: {
        message: {
          id: message.message_id,
          subject: message.subject,
          content: message.content,
          sender: message.sender_name,
          senderEmail: message.sender_email,
          recipient: message.recipient_name,
          recipientEmail: message.recipient_email,
          sentAt: message.sent_at,
          isRead: message.is_read,
          isStarred: message.is_starred,
          messageType: message.message_type,
          relatedRequestId: message.related_request_id,
        },
        replies: repliesResult.rows.map((reply) => ({
          id: reply.message_id,
          content: reply.content,
          sentAt: reply.sent_at,
          sender: reply.sender_name,
          senderId: reply.sender_id,
          senderType: reply.user_type,
        })),
      },
    });
  } catch (error) {
    console.error("Get message details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch message details",
    });
  }
};

const sendMessage = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      recipientId,
      subject,
      content,
      messageType = "general",
      relatedRequestId = null,
    } = req.body;

    const senderId = req.user.id;

    if (!recipientId || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Recipient, subject and content are required",
      });
    }

    // Check if there's already a message for this service request
    if (relatedRequestId && messageType === "service_request") {
      const existingMessageQuery = `
        SELECT message_id 
        FROM messages 
        WHERE related_request_id = $1 
          AND message_type = 'service_request'
          AND NOT EXISTS (
            SELECT 1 FROM message_replies mr 
            WHERE mr.reply_message_id = message_id
          )
        LIMIT 1
      `;

      const existingMessage = await client.query(existingMessageQuery, [
        relatedRequestId,
      ]);

      if (existingMessage.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message:
            "A message already exists for this service request. Please use the reply function instead.",
        });
      }
    }

    const recipientQuery = `
      SELECT first_name, last_name, email 
      FROM users 
      WHERE user_id = $1
    `;
    const recipientResult = await client.query(recipientQuery, [recipientId]);

    if (recipientResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    const recipient = recipientResult.rows[0];
    const recipientName =
      `${recipient.first_name} ${recipient.last_name}`.trim();
    const recipientEmail = recipient.email;

    const insertQuery = `
      INSERT INTO messages (
        sender_id, 
        recipient_id, 
        subject, 
        content, 
        message_type,
        related_request_id,
        sent_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING message_id, sent_at
    `;

    const result = await client.query(insertQuery, [
      senderId,
      recipientId,
      subject,
      content.trim(),
      messageType,
      relatedRequestId,
    ]);

    const messageId = result.rows[0].message_id;
    const sentAt = result.rows[0].sent_at;

    try {
      await supabase.from("audit_log").insert({
        table_name: "messages",
        record_id: messageId,
        action: "CREATE",
        new_values: {
          recipient_id: recipientId,
          recipient_name: recipientName,
          subject: subject,
          message_type: messageType,
          related_request_id: relatedRequestId,
        },
        changed_by: req.user.email,
        change_reason: `New message sent to ${recipientName}`,
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    await client.query("COMMIT");

    try {
      // Get sender's name
      const senderQuery = await pool.query(
        "SELECT first_name, last_name FROM users WHERE user_id = $1",
        [senderId]
      );

      const senderName =
        senderQuery.rows.length > 0
          ? `${senderQuery.rows[0].first_name} ${senderQuery.rows[0].last_name}`
          : req.user.email;

      const contentPreview =
        content.length > 100 ? content.substring(0, 100) + "..." : content;

      await createNotification(
        recipientId,
        "New Message",
        subject,
        `You have received a new message from ${senderName}. ${contentPreview}`,
        recipientEmail
      );

      console.log(
        `✅ Message notification sent to ${recipientEmail} (${recipientName})`
      );
    } catch (notifError) {
      console.error("❌ Failed to send message notification:", notifError);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        messageId: messageId,
        sentAt: sentAt,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  } finally {
    client.release();
  }
};

const createServiceRequestMessage = async (req, res) => {
  const client = await pool.connect();

  try {
    console.log("⚡ createServiceRequestMessage called!"); // ADD THIS LINE
    await client.query("BEGIN");

    const requestId = req.params.requestId;

    const { subject, content } = req.body;

    const senderId = req.user.id;

    if (!requestId || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Request ID, subject and content are required",
      });
    }

    // Check if message already exists for this service request
    const existingMessageQuery = `
      SELECT message_id 
      FROM messages 
      WHERE related_request_id = $1 
        AND message_type = 'service_request'
        AND NOT EXISTS (
          SELECT 1 FROM message_replies mr 
          WHERE mr.reply_message_id = message_id
        )
      LIMIT 1
    `;

    const existingMessage = await client.query(existingMessageQuery, [
      requestId,
    ]);

    if (existingMessage.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message:
          "A message thread already exists for this service request. Please check your Messages tab.",
      });
    }

    // Get admin/staff users to send message to
    const recipientQuery = `
      SELECT user_id, first_name, last_name, email 
      FROM users 
      WHERE user_type IN ('admin', 'staff') 
        AND status = 'Active'
      ORDER BY user_type 
      LIMIT 1
    `;
    const recipientResult = await client.query(recipientQuery);

    if (recipientResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "No available admin/staff to receive message",
      });
    }

    const recipient = recipientResult.rows[0];
    const recipientId = recipient.user_id;
    const recipientName =
      `${recipient.first_name} ${recipient.last_name}`.trim();
    const recipientEmail = recipient.email;

    const insertQuery = `
      INSERT INTO messages (
        sender_id, 
        recipient_id, 
        subject, 
        content, 
        message_type,
        related_request_id,
        sent_at
      )
      VALUES ($1, $2, $3, $4, 'service_request', $5, NOW())
      RETURNING message_id, sent_at
    `;

    const result = await client.query(insertQuery, [
      senderId,
      recipientId,
      subject,
      content.trim(),
      requestId,
    ]);

    const messageId = result.rows[0].message_id;
    const sentAt = result.rows[0].sent_at;

    try {
      await supabase.from("audit_log").insert({
        table_name: "messages",
        record_id: messageId,
        action: "CREATE",
        new_values: {
          recipient_id: recipientId,
          recipient_name: recipientName,
          subject: subject,
          message_type: "service_request",
          related_request_id: requestId,
        },
        changed_by: req.user.email,
        change_reason: `New service request message for request #${requestId}`,
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    await client.query("COMMIT");

    try {
      console.log(
        "🔔 Starting notification process for service request message"
      );

      // Get sender's name
      const senderQuery = await pool.query(
        "SELECT first_name, last_name FROM users WHERE user_id = $1",
        [senderId]
      );

      const senderName =
        senderQuery.rows.length > 0
          ? `${senderQuery.rows[0].first_name} ${senderQuery.rows[0].last_name}`
          : "Unknown User";

      console.log("📧 Sender name:", senderName);

      const contentPreview =
        content.length > 100 ? content.substring(0, 100) + "..." : content;

      // Notify all admins
      const allAdminsQuery = `
        SELECT user_id, email FROM users 
        WHERE user_type = 'admin' AND status = 'Active'
      `;
      const allAdminsResult = await pool.query(allAdminsQuery);

      console.log(`📢 Found ${allAdminsResult.rows.length} admins to notify`);

      for (const admin of allAdminsResult.rows) {
        console.log(`🔔 Notifying admin: ${admin.email}`);
        await createNotification(
          admin.user_id,
          "Service Request", // ✅ Use this valid type
          subject,
          `New message from ${senderName}. ${contentPreview}`,
          admin.email
        );
      }

      // Notify assigned staff if exists
      const assignedStaffQuery = `
        SELECT sr.assigned_to_staff_id, u.email, u.first_name, u.last_name
        FROM service_requests sr
        JOIN users u ON sr.assigned_to_staff_id = u.user_id
        WHERE sr.request_id = $1 AND sr.assigned_to_staff_id IS NOT NULL AND u.status = 'Active'
      `;
      const assignedStaffResult = await pool.query(assignedStaffQuery, [
        requestId,
      ]);

      console.log(
        `📢 Found ${assignedStaffResult.rows.length} assigned staff to notify`
      );

      if (assignedStaffResult.rows.length > 0) {
        const assignedStaff = assignedStaffResult.rows[0];
        console.log(`🔔 Notifying assigned staff: ${assignedStaff.email}`);
        await createNotification(
          assignedStaff.assigned_to_staff_id,
          "Service Request", // ✅ Use this valid type
          subject,
          `New message from ${senderName}. ${contentPreview}`,
          assignedStaff.email
        );
      }

      console.log(`✅ Service request message notifications sent successfully`);
    } catch (notifError) {
      console.error("❌ Failed to send notification:", notifError);
      console.error("❌ Full error details:", notifError.stack);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        messageId: messageId,
        sentAt: sentAt,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create service request message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  } finally {
    client.release();
  }
};

const replyToMessage = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    // Get the original message details
    const originalQuery = `
      SELECT 
        m.*,
        sender.first_name || ' ' || sender.last_name as sender_name,
        recipient.first_name || ' ' || recipient.last_name as recipient_name,
        recipient.email as recipient_email
      FROM messages m
      JOIN users sender ON m.sender_id = sender.user_id
      JOIN users recipient ON m.recipient_id = recipient.user_id
      WHERE m.message_id = $1
    `;

    const originalResult = await client.query(originalQuery, [messageId]);

    if (originalResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Original message not found",
      });
    }

    const original = originalResult.rows[0];

    // Determine recipient of reply (opposite of who sent the original or last reply)
    let recipientId;
    let recipientFirstName;
    let recipientLastName;
    let recipientEmail;

    // Check who should receive this reply
    // If the current user is the original sender, reply goes to original recipient
    // If the current user is the original recipient, reply goes to original sender
    if (senderId === original.sender_id) {
      recipientId = original.recipient_id;
      const recipientQuery = await client.query(
        "SELECT first_name, last_name, email FROM users WHERE user_id = $1",
        [recipientId]
      );
      recipientFirstName = recipientQuery.rows[0].first_name;
      recipientLastName = recipientQuery.rows[0].last_name;
      recipientEmail = recipientQuery.rows[0].email;
    } else {
      recipientId = original.sender_id;
      const recipientQuery = await client.query(
        "SELECT first_name, last_name, email FROM users WHERE user_id = $1",
        [recipientId]
      );
      recipientFirstName = recipientQuery.rows[0].first_name;
      recipientLastName = recipientQuery.rows[0].last_name;
      recipientEmail = recipientQuery.rows[0].email;
    }

    // Create the reply subject
    const replySubject = original.subject.startsWith("Re: ")
      ? original.subject
      : `Re: ${original.subject}`;

    // Insert reply as a new message
    const insertReplyQuery = `
      INSERT INTO messages (
        sender_id,
        recipient_id,
        subject,
        content,
        message_type,
        related_request_id,
        sent_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING message_id, sent_at
    `;

    const replyResult = await client.query(insertReplyQuery, [
      senderId,
      recipientId,
      replySubject,
      content.trim(),
      original.message_type,
      original.related_request_id,
    ]);

    const replyId = replyResult.rows[0].message_id;

    // Link reply to original message
    await client.query(
      `INSERT INTO message_replies (original_message_id, reply_message_id) VALUES ($1, $2)`,
      [messageId, replyId]
    );

    // Remove read status for ALL users except the sender
    // This makes the thread unread for everyone when there's a new reply
    await client.query(
      `DELETE FROM message_read_status 
       WHERE message_id = $1 
       AND user_id != $2`,
      [messageId, senderId]
    );

    console.log(
      `🔔 Marked message ${messageId} as unread for all users except sender ${senderId}`
    );

    try {
      await supabase.from("audit_log").insert({
        table_name: "messages",
        record_id: replyId,
        action: "CREATE",
        new_values: {
          message_reply: true,
          original_message_id: messageId,
          recipient_id: recipientId,
          recipient_name: `${recipientFirstName} ${recipientLastName}`,
          subject: replySubject,
        },
        changed_by: req.user.email,
        change_reason: `Replied to message: ${original.subject}`,
        ip_address: req.ip || req.connection.remoteAddress,
      });
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    await client.query("COMMIT");

    try {
      // Get sender's name
      const senderQuery = await pool.query(
        "SELECT first_name, last_name FROM users WHERE user_id = $1",
        [senderId]
      );

      const senderName =
        senderQuery.rows.length > 0
          ? `${senderQuery.rows[0].first_name} ${senderQuery.rows[0].last_name}`
          : req.user.email;

      const recipientName = `${recipientFirstName} ${recipientLastName}`.trim();
      const contentPreview =
        content.length > 100 ? content.substring(0, 100) + "..." : content;

      await createNotification(
        recipientId,
        "New Message",
        `Reply to: ${original.subject}`,
        `You have received a reply from ${senderName}. ${contentPreview}`,
        recipientEmail
      );

      console.log(
        `✅ Reply notification sent to ${recipientEmail} (${recipientName})`
      );
    } catch (notifError) {
      console.error("❌ Failed to send reply notification:", notifError);
    }

    res.status(201).json({
      success: true,
      message: "Reply sent successfully",
      data: {
        messageId: replyId,
        sentAt: replyResult.rows[0].sent_at,
        recipientEmail: recipientEmail,
        recipientName: `${recipientFirstName} ${recipientLastName}`,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reply to message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reply",
    });
  } finally {
    client.release();
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT get_user_unread_count($1) as count",
      [userId]
    );
    const unreadCount = result.rows[0]?.count || 0;

    res.json({
      success: true,
      data: {
        unreadCount: unreadCount,
      },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
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
        message: "Message IDs array is required",
      });
    }

    // Insert read status for this user and these messages
    // Use ON CONFLICT to avoid duplicates if already marked as read
    const query = `
      INSERT INTO message_read_status (user_id, message_id, read_at)
      SELECT $1, unnest($2::int[]), NOW()
      ON CONFLICT (user_id, message_id) DO NOTHING
    `;

    const result = await pool.query(query, [userId, messageIds]);

    res.json({
      success: true,
      message: `Message(s) marked as read`,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
    });
  }
};

const deleteMessages = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { messageIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message IDs array is required",
      });
    }

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

    const messagesResult = await client.query(messageQuery, [
      messageIds,
      userId,
    ]);

    const query = `
      UPDATE messages 
      SET sender_deleted = CASE WHEN sender_id = $2 THEN TRUE ELSE sender_deleted END,
          recipient_deleted = CASE WHEN recipient_id = $2 THEN TRUE ELSE recipient_deleted END
      WHERE message_id = ANY($1) 
        AND (sender_id = $2 OR recipient_id = $2)
    `;

    const result = await client.query(query, [messageIds, userId]);

    try {
      for (const message of messagesResult.rows) {
        const isSender = message.sender_id === userId;
        await supabase.from("audit_log").insert({
          table_name: "messages",
          record_id: message.message_id,
          action: "DELETE",
          new_values: {
            message_deleted: true,
            deleted_by_role: isSender ? "sender" : "recipient",
            subject: message.subject,
            other_party: isSender
              ? message.recipient_name
              : message.sender_name,
          },
          changed_by: req.user.email,
          change_reason: `Message deleted by ${
            isSender ? "sender" : "recipient"
          }`,
          ip_address: req.ip || req.connection.remoteAddress,
        });
      }
    } catch (auditError) {
      console.error("Failed to log audit entry:", auditError);
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `${result.rowCount} message(s) deleted`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete messages",
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

    if (userType === "client") {
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
      data: result.rows,
    });
  } catch (error) {
    console.error("Get messageable users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
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
  createServiceRequestMessage,
};
