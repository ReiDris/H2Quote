const express = require("express");
const router = express.Router();
const {
  getActivityLogs,
  exportActivityLogs,
  getActivityLogStats,
} = require("../controllers/activityLogController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

/**
 * @route   GET /api/activity-logs
 * @desc    Get paginated activity logs with filters
 * @access  Admin, Staff
 * @query   page, limit, startDate, endDate, userId, action, tableName, searchTerm
 */
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  getActivityLogs
);

/**
 * @route   GET /api/activity-logs/export
 * @desc    Export activity logs to CSV
 * @access  Admin, Staff
 * @query   startDate, endDate, userId, action, tableName, searchTerm
 */
router.get(
  "/export",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  exportActivityLogs
);

/**
 * @route   GET /api/activity-logs/stats
 * @desc    Get activity log statistics
 * @access  Admin, Staff
 * @query   startDate, endDate
 */
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  getActivityLogStats
);

module.exports = router;