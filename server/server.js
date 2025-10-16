require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Environment variable check
if (!process.env.JWT_SECRET || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || 
    !process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
    console.error('❌ Missing required environment variables');
    console.log('Required variables: JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD');
    process.exit(1);
}

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://h2-quote.vercel.app',
  'https://h2quote.onrender.com'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes with detailed error tracking
console.log('🔧 Loading route files...\n');

let authRoutes, adminRoutes, healthRoutes, serviceRequestRoutes;
let messageRoutes, chatbotRoutes, accountSettingsRoutes, paymentRoutes, notificationRoutes;

try {
  authRoutes = require('./routes/googleOAuth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Error loading admin routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  healthRoutes = require('./routes/health');
  console.log('✅ Health routes loaded');
} catch (error) {
  console.error('❌ Error loading health routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  serviceRequestRoutes = require('./routes/serviceRequests');
  console.log('✅ Service request routes loaded');
} catch (error) {
  console.error('❌ Error loading service request routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  messageRoutes = require('./routes/messaging');
  console.log('✅ Message routes loaded');
} catch (error) {
  console.error('❌ Error loading message routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  chatbotRoutes = require('./routes/chatbot');
  console.log('✅ Chatbot routes loaded');
} catch (error) {
  console.error('❌ Error loading chatbot routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  accountSettingsRoutes = require('./routes/accountSettings');
  console.log('✅ Account settings routes loaded');
} catch (error) {
  console.error('❌ Error loading account settings routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  paymentRoutes = require('./routes/payment');
  console.log('✅ Payment routes loaded');
} catch (error) {
  console.error('❌ Error loading payment routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  notificationRoutes = require('./routes/notifications');
  console.log('✅ Notification routes loaded');
} catch (error) {
  console.error('❌ Error loading notification routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('\n📋 All route files loaded successfully!');
console.log('🔗 Now registering routes...\n');

// Register routes with error handling
try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered at /api/auth');
} catch (error) {
  console.error('❌ Error registering auth routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes registered at /api/admin');
} catch (error) {
  console.error('❌ Error registering admin routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  app.use('/api', healthRoutes);
  console.log('✅ Health routes registered at /api');
} catch (error) {
  console.error('❌ Error registering health routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  app.use('/api/service-requests', serviceRequestRoutes);
  console.log('✅ Service request routes registered at /api/service-requests');
} catch (error) {
  console.error('❌ Error registering service request routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  app.use('/api/messaging', messageRoutes);
  console.log('✅ Message routes registered at /api/messaging');
} catch (error) {
  console.error('❌ Error registering message routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  app.use('/api/chatbot', chatbotRoutes);
  console.log('✅ Chatbot routes registered at /api/chatbot');
} catch (error) {
  console.error('❌ Error registering chatbot routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  app.use('/api/account', accountSettingsRoutes);
  console.log('✅ Account settings routes registered at /api/account');
} catch (error) {
  console.error('❌ Error registering account settings routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  app.use('/api/payments', paymentRoutes);
  console.log('✅ Payment routes registered at /api/payments');
} catch (error) {
  console.error('❌ Error registering payment routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notification routes registered at /api/notifications');
} catch (error) {
  console.error('❌ Error registering notification routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('\n✅ All routes registered successfully!');

// Error handler middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => {
    console.log(`\n🚀 H2Quote server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;