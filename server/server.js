require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// === CRITICAL: Environment Variable Check ===
const requiredEnvVars = [
  'JWT_SECRET',
  'SUPABASE_URL', 
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_DB_HOST',
  'SUPABASE_DB_PASSWORD'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  process.exit(1);
}

// === CORS Configuration ===
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://h2-quote.vercel.app',
  'http://h2-quote.vercel.app',
  'https://h2quote.onrender.com'
];

// Add custom URLs from environment
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

console.log('🔐 Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('⚠️ Blocked by CORS:', origin);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  optionsSuccessStatus: 200
};

// Apply CORS BEFORE other middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// === Request Logging Middleware ===
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// === Load Routes ===
console.log('\n🚀 H2Quote Server');
console.log('📍 Port: ' + (process.env.PORT || 5000));
console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));

let authRoutes, adminRoutes, healthRoutes, serviceRequestRoutes;
let messageRoutes, chatbotRoutes, accountSettingsRoutes;
let paymentRoutes, notificationRoutes;

try {
  authRoutes = require('./routes/googleOAuth');
  console.log('✅ Loaded: googleOAuth routes');
} catch (e) {
  console.error('❌ Failed to load googleOAuth routes:', e.message);
  process.exit(1);
}

try {
  adminRoutes = require('./routes/admin');
  console.log('✅ Loaded: admin routes');
} catch (e) {
  console.error('❌ Failed to load admin routes:', e.message);
}

try {
  healthRoutes = require('./routes/health');
  console.log('✅ Loaded: health routes');
} catch (e) {
  console.error('❌ Failed to load health routes:', e.message);
}

try {
  serviceRequestRoutes = require('./routes/serviceRequests');
  console.log('✅ Loaded: serviceRequests routes');
} catch (e) {
  console.error('❌ Failed to load serviceRequests routes:', e.message);
}

try {
  messageRoutes = require('./routes/messaging');
  console.log('✅ Loaded: messaging routes');
} catch (e) {
  console.error('❌ Failed to load messaging routes:', e.message);
}

try {
  chatbotRoutes = require('./routes/chatbot');
  console.log('✅ Loaded: chatbot routes');
} catch (e) {
  console.error('❌ Failed to load chatbot routes:', e.message);
}

try {
  accountSettingsRoutes = require('./routes/accountSettings');
  console.log('✅ Loaded: accountSettings routes');
} catch (e) {
  console.error('❌ Failed to load accountSettings routes:', e.message);
}

try {
  paymentRoutes = require('./routes/payment');
  console.log('✅ Loaded: payment routes');
} catch (e) {
  console.error('❌ Failed to load payment routes:', e.message);
}

try {
  notificationRoutes = require('./routes/notifications');
  console.log('✅ Loaded: notifications routes');
} catch (e) {
  console.error('❌ Failed to load notifications routes:', e.message);
}

// === Register Routes ===
console.log('\n📦 Registering API routes...');

if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('  ✓ /api/auth');
}

if (adminRoutes) {
  app.use('/api/admin', adminRoutes);
  console.log('  ✓ /api/admin');
}

if (healthRoutes) {
  app.use('/api', healthRoutes);
  console.log('  ✓ /api/health');
}

if (serviceRequestRoutes) {
  app.use('/api/service-requests', serviceRequestRoutes);
  console.log('  ✓ /api/service-requests');
}

if (messageRoutes) {
  app.use('/api/messaging', messageRoutes);
  console.log('  ✓ /api/messaging');
}

if (chatbotRoutes) {
  app.use('/api/chatbot', chatbotRoutes);
  console.log('  ✓ /api/chatbot');
}

if (accountSettingsRoutes) {
  app.use('/api/account', accountSettingsRoutes);
  console.log('  ✓ /api/account');
}

if (paymentRoutes) {
  app.use('/api/payments', paymentRoutes);
  console.log('  ✓ /api/payments');
}

if (notificationRoutes) {
  app.use('/api/notifications', notificationRoutes);
  console.log('  ✓ /api/notifications');
}

console.log('\n✅ Server running\n');

// === Error Handlers ===
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.use((req, res) => {
  console.warn('⚠️ 404 Not Found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
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

module.exports = app;