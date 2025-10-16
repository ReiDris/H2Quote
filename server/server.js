/*require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// === CRITICAL: Environment Variable Check ===
const requiredEnvVars = [
  "JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_DB_HOST",
  "SUPABASE_DB_PASSWORD",
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars);
  process.exit(1);
}

// === CORS Configuration ===
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "https://h2-quote.vercel.app",
  "http://h2-quote.vercel.app",
  "https://h2quote.onrender.com",
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

console.log("🔐 Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes("vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin || "none"}`);
  next();
});

// === Load Routes ===
console.log("\n🚀 H2Quote Server");
console.log("🔌 Port: " + (process.env.PORT || 5000));
console.log("🌍 Environment: " + (process.env.NODE_ENV || "development"));
console.log("\n📦 Loading routes...\n");

// ✅ SIMPLE: Just require them directly - comment out any line to disable a route
//const authRoutes = require("./routes/googleOAuth");
const adminRoutes = require("./routes/admin");
//const healthRoutes = require("./routes/health");
//const serviceRequestRoutes = require("./routes/serviceRequests");
//const messageRoutes = require("./routes/messaging");
//const chatbotRoutes = require("./routes/chatbot");
//const accountSettingsRoutes = require("./routes/accountSettings");
//const paymentRoutes = require("./routes/payment");
//const notificationRoutes = require("./routes/notifications");
//const clientRoutes = require("./routes/clients");
//const userRoutes = require("./routes/users");

console.log("✅ All routes loaded successfully!\n");

// === Register Routes ===
console.log("📦 Registering API routes...\n");

//app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
//app.use("/api", healthRoutes);
//app.use("/api/service-requests", serviceRequestRoutes);
//app.use("/api/messaging", messageRoutes);
//app.use("/api/chatbot", chatbotRoutes);
//app.use("/api/account", accountSettingsRoutes);
//app.use("/api/payments", paymentRoutes);
//app.use("/api/notifications", notificationRoutes);
//app.use("/api/clients", clientRoutes);
//app.use("/api/users", userRoutes);

//console.log("  ✓ /api/auth");
console.log("  ✓ /api/admin");
//console.log("  ✓ /api/health");
//console.log("  ✓ /api/service-requests");
//console.log("  ✓ /api/messaging");
//console.log("  ✓ /api/chatbot");
//console.log("  ✓ /api/account");
//console.log("  ✓ /api/payments");
//console.log("  ✓ /api/notifications");
//console.log("  ✓ /api/clients");
//console.log("  ✓ /api/users");

console.log("\n✅ Server running\n");

// === Error Handlers ===
app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

app.use((req, res) => {
  console.warn("⚠️ 404 Not Found:", req.method, req.path);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🎉 H2Quote API Server is live!`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log(`📝 Logs will appear below...\n`);
});

module.exports = app;*/

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://h2-quote.vercel.app',
  'https://h2quote.onrender.com'
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load routes - EXACT same way as ultra-simple-debug that worked
const authRoutes = require('./routes/googleOAuth');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const serviceRequestRoutes = require('./routes/serviceRequests');
const messageRoutes = require('./routes/messaging');
const chatbotRoutes = require('./routes/chatbot');
const accountSettingsRoutes = require('./routes/accountSettings');
const paymentRoutes = require('./routes/payment');
const notificationRoutes = require('./routes/notifications');
const clientRoutes = require('./routes/clients');
const userRoutes = require('./routes/users');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', healthRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/messaging', messageRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/account', accountSettingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use((error, req, res, next) => {
    console.error('Error:', error.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('H2Quote Server');
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log('Server running');
});

module.exports = app;