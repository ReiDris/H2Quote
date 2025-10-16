require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Environment variable check
if (!process.env.JWT_SECRET || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || 
    !process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
    console.error('❌ Missing required environment variables');
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

console.log('🔍 BISECTION DEBUG - Loading routes one by one...\n');

// Load routes one at a time with detailed error reporting
console.log('Loading: googleOAuth...');
try {
  const authRoutes = require('./routes/googleOAuth');
  console.log('✅ googleOAuth loaded successfully');
  app.use('/api/auth', authRoutes);
  console.log('✅ googleOAuth registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN googleOAuth (auth.js) ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('Loading: admin...');
try {
  const adminRoutes = require('./routes/admin');
  console.log('✅ admin loaded successfully');
  app.use('/api/admin', adminRoutes);
  console.log('✅ admin registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN admin.js ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('Loading: health...');
try {
  const healthRoutes = require('./routes/health');
  console.log('✅ health loaded successfully');
  app.use('/api', healthRoutes);
  console.log('✅ health registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN health.js ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('Loading: serviceRequests...');
try {
  const serviceRequestRoutes = require('./routes/serviceRequests');
  console.log('✅ serviceRequests loaded successfully');
  app.use('/api/service-requests', serviceRequestRoutes);
  console.log('✅ serviceRequests registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN serviceRequests.js ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('Loading: messaging...');
try {
  const messageRoutes = require('./routes/messaging');
  console.log('✅ messaging loaded successfully');
  app.use('/api/messaging', messageRoutes);
  console.log('✅ messaging registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN messaging.js ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('Loading: chatbot...');
try {
  const chatbotRoutes = require('./routes/chatbot');
  console.log('✅ chatbot loaded successfully');
  app.use('/api/chatbot', chatbotRoutes);
  console.log('✅ chatbot registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN chatbot.js ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('Loading: accountSettings...');
try {
  const accountSettingsRoutes = require('./routes/accountSettings');
  console.log('✅ accountSettings loaded successfully');
  app.use('/api/account', accountSettingsRoutes);
  console.log('✅ accountSettings registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN accountSettings.js ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('Loading: payment...');
try {
  const paymentRoutes = require('./routes/payment');
  console.log('✅ payment loaded successfully');
  app.use('/api/payments', paymentRoutes);
  console.log('✅ payment registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN payment.js ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('Loading: notifications...');
try {
  const notificationRoutes = require('./routes/notifications');
  console.log('✅ notifications loaded successfully');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ notifications registered successfully\n');
} catch (error) {
  console.error('❌❌❌ ERROR IN notifications.js ❌❌❌');
  console.error('Error message:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('🎉 ALL ROUTES LOADED AND REGISTERED SUCCESSFULLY!\n');

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