// routes/health.js
const express = require('express');
const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'H2Quote server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Detailed health check (optional)
router.get('/health/detailed', async (req, res) => {
  try {
    // You can add database ping, external service checks here
    const healthData = {
      success: true,
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      // Add database check if needed:
      // database: await checkDatabaseConnection(),
      // supabase: await checkSupabaseConnection()
    };

    res.json(healthData);
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;