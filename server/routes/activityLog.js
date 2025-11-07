const express = require("express");
const router = express.Router();
const {
  getActivityLogs,
  exportActivityLogs,
  getActivityLogStats,
} = require("../controllers/activityLogController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");


router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  getActivityLogs
);


router.get(
  "/export",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  exportActivityLogs
);

router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  getActivityLogStats
);

module.exports = router;