require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/googleOAuth');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const serviceRequestRoutes = require('./routes/serviceRequests');
const messageRoutes = require('./routes/messaging');
const chatbotRoutes = require('./routes/chatbot');
const accountSettingsRoutes = require('./routes/accountSettings'); 
const paymentRoutes = require('./routes/payment');
const notificationRoutes = require('./routes/notifications');

const app = express();

if (!process.env.JWT_SECRET || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || 
    !process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
    console.error('Missing required environment variables');
    console.log('Required variables: JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD');
    process.exit(1);
}

// IMPROVED CORS CONFIGURATION
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://h2-quote.vercel.app',
  'https://h2quote.onrender.com'
];

// Add environment URLs if they exist
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl, etc.)
    if (!origin) {
      console.log('Request with no origin (allowed)');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
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

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.get('origin') || 'no origin'}`);
  next();
});

// 🔍 DEBUG: Load routes with error catching
console.log('🔍 Starting route registration...');

try {
  console.log('Loading auth routes...');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in auth routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('Loading admin routes...');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in admin routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('Loading health routes...');
  app.use('/api', healthRoutes);
  console.log('✅ Health routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in health routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('Loading service request routes...');
  app.use('/api/service-requests', serviceRequestRoutes);
  console.log('✅ Service request routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in service request routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('Loading messaging routes...');
  app.use('/api/messaging', messageRoutes);
  console.log('✅ Messaging routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in messaging routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('Loading chatbot routes...');
  app.use('/api/chatbot', chatbotRoutes);
  console.log('✅ Chatbot routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in chatbot routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('Loading account settings routes...');
  app.use('/api/account', accountSettingsRoutes);
  console.log('✅ Account settings routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in account settings routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('Loading payment routes...');
  app.use('/api/payments', paymentRoutes);
  console.log('✅ Payment routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in payment routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

try {
  console.log('Loading notification routes...');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notification routes loaded successfully');
} catch (error) {
  console.error('❌ ERROR in notification routes:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

console.log('🎉 All routes loaded successfully!');

// Error handling middleware
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
    console.log('404: Route not found for', req.method, req.path);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => {
    console.log(`H2Quote server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS enabled for origins:`, allowedOrigins);
});

module.exports = app;