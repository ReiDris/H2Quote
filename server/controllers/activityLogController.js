const pool = require("../config/database");
const { Parser } = require("json2csv");

const getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      userId,
      action,
      tableName,
      searchTerm,
    } = req.query;

    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (startDate) {
      whereConditions.push(`al.created_at >= $${paramCount}`);
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereConditions.push(`al.created_at <= $${paramCount}`);
      queryParams.push(endDate);
      paramCount++;
    }

    if (userId) {
      whereConditions.push(`al.record_id = $${paramCount}`);
      queryParams.push(userId);
      paramCount++;
    }

    if (action) {
      whereConditions.push(`al.action = $${paramCount}`);
      queryParams.push(action);
      paramCount++;
    }

    if (tableName) {
      whereConditions.push(`al.table_name = $${paramCount}`);
      queryParams.push(tableName);
      paramCount++;
    }

    if (searchTerm) {
      whereConditions.push(
        `(al.changed_by ILIKE $${paramCount} OR al.change_reason ILIKE $${paramCount})`
      );
      queryParams.push(`%${searchTerm}%`);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_log al
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalRecords = parseInt(countResult.rows[0].total);

    const logsQuery = `
      SELECT 
        al.log_id,
        al.table_name,
        al.record_id,
        al.action,
        al.old_values,
        al.new_values,
        al.changed_by,
        al.change_reason,
        al.client_notified,
        al.ip_address,
        al.created_at,
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.user_type as role
      FROM audit_log al
      LEFT JOIN users u ON al.changed_by = u.email
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(limit, offset);
    const logsResult = await pool.query(logsQuery, queryParams);

    const formattedLogs = logsResult.rows.map((log) => {
      const logDate = new Date(log.created_at);
      const formattedDate = logDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const formattedTime = logDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      let userIdDisplay = "SYSTEM";
      if (log.user_id) {
        userIdDisplay = `#USER${String(log.user_id).padStart(2, "0")}`;
      }

      let name = log.user_name || "System";
      let role = log.role ? log.role.charAt(0).toUpperCase() + log.role.slice(1) : "System";

      if (log.changed_by && !log.user_name) {
        const emailName = log.changed_by.split("@")[0];
        name = emailName.replace(/[._-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      return {
        userId: userIdDisplay,
        name: name,
        role: role,
        date: formattedDate,
        time: formattedTime,
        action: log.change_reason || `${log.action} on ${log.table_name}`,
        fullAction: log.change_reason,
        tableName: log.table_name,
        actionType: log.action,
        changedBy: log.changed_by,
        ipAddress: log.ip_address,
        oldValues: log.old_values,
        newValues: log.new_values,
        createdAt: log.created_at,
      };
    });

    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalRecords: totalRecords,
        limit: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const exportActivityLogs = async (req, res) => {
  try {
    const { startDate, endDate, userId, action, tableName, searchTerm } =
      req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (startDate) {
      whereConditions.push(`al.created_at >= $${paramCount}`);
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereConditions.push(`al.created_at <= $${paramCount}`);
      queryParams.push(endDate);
      paramCount++;
    }

    if (userId) {
      whereConditions.push(`al.record_id = $${paramCount}`);
      queryParams.push(userId);
      paramCount++;
    }

    if (action) {
      whereConditions.push(`al.action = $${paramCount}`);
      queryParams.push(action);
      paramCount++;
    }

    if (tableName) {
      whereConditions.push(`al.table_name = $${paramCount}`);
      queryParams.push(tableName);
      paramCount++;
    }

    if (searchTerm) {
      whereConditions.push(
        `(al.changed_by ILIKE $${paramCount} OR al.change_reason ILIKE $${paramCount})`
      );
      queryParams.push(`%${searchTerm}%`);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const logsQuery = `
      SELECT 
        al.log_id,
        al.table_name,
        al.record_id,
        al.action,
        al.changed_by,
        al.change_reason,
        al.ip_address,
        al.created_at,
        u.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.user_type as role
      FROM audit_log al
      LEFT JOIN users u ON al.changed_by = u.email
      ${whereClause}
      ORDER BY al.created_at DESC
    `;

    const logsResult = await pool.query(logsQuery, queryParams);

    if (logsResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No activity logs found for export",
      });
    }

    const csvData = logsResult.rows.map((log) => {
      const logDate = new Date(log.created_at);
      const formattedDate = logDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const formattedTime = logDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      let userIdDisplay = "SYSTEM";
      if (log.user_id) {
        userIdDisplay = `#USER${String(log.user_id).padStart(2, "0")}`;
      }

      let name = log.user_name || "System";
      let role = log.role ? log.role.charAt(0).toUpperCase() + log.role.slice(1) : "System";

      if (log.changed_by && !log.user_name) {
        const emailName = log.changed_by.split("@")[0];
        name = emailName.replace(/[._-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      return {
        "User ID": userIdDisplay,
        Name: name,
        Role: role,
        Date: formattedDate,
        Time: formattedTime,
        Action: log.change_reason || `${log.action} on ${log.table_name}`,
        "Changed By": log.changed_by || "System",
        "IP Address": log.ip_address || "N/A",
        "Table Name": log.table_name,
        "Action Type": log.action,
      };
    });

    const fields = [
      "User ID",
      "Name",
      "Role",
      "Date",
      "Time",
      "Action",
      "Changed By",
      "IP Address",
      "Table Name",
      "Action Type",
    ];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    const filename = `activity_logs_${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.status(200).send(csv);
  } catch (error) {
    console.error("Export activity logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export activity logs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getActivityLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    if (startDate) {
      whereConditions.push(`created_at >= $${paramCount}`);
      queryParams.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramCount}`);
      queryParams.push(endDate);
      paramCount++;
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT changed_by) as unique_users,
        COUNT(CASE WHEN action = 'CREATE' THEN 1 END) as total_creates,
        COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as total_updates,
        COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as total_deletes,
        COUNT(CASE WHEN table_name = 'users' THEN 1 END) as user_activities,
        COUNT(CASE WHEN table_name = 'service_requests' THEN 1 END) as service_request_activities,
        COUNT(CASE WHEN table_name = 'messages' THEN 1 END) as message_activities,
        COUNT(CASE WHEN table_name = 'quotations' THEN 1 END) as quotation_activities
      FROM audit_log
      ${whereClause}
    `;

    const statsResult = await pool.query(statsQuery, queryParams);

    res.json({
      success: true,
      data: statsResult.rows[0],
    });
  } catch (error) {
    console.error("Get activity log stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity log statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getActivityLogs,
  exportActivityLogs,
  getActivityLogStats,
};