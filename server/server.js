require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

if (!process.env.JWT_SECRET || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || 
    !process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
    console.error('Missing required environment variables');
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
      console.log('CORS blocked for origin:', origin);
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

// DEBUG: Load routes one by one to find the problematic one
console.log('==========================================');
console.log('Loading routes (DEBUG MODE)...');
console.log('==========================================');

try {
  console.log('[1/9] Loading auth routes...');
  const authRoutes = require('./routes/googleOAuth');
  app.use('/api/auth', authRoutes);
  console.log('SUCCESS: Auth routes loaded');
} catch (error) {
  console.error('FAILED: Auth routes');
  console.error('Error:', error.message);
  process.exit(1);
}

try {
  console.log('[2/9] Loading admin routes...');
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('SUCCESS: Admin routes loaded');
} catch (error) {
  console.error('FAILED: Admin routes');
  console.error('Error:', error.message);
  process.exit(1);
}

try {
  console.log('[3/9] Loading health routes...');
  const healthRoutes = require('./routes/health');
  app.use('/api', healthRoutes);
  console.log('SUCCESS: Health routes loaded');
} catch (error) {
  console.error('FAILED: Health routes');
  console.error('Error:', error.message);
  process.exit(1);
}

try {
  console.log('[4/9] Loading service request routes...');
  const serviceRequestRoutes = require('./routes/serviceRequests');
  app.use('/api/service-requests', serviceRequestRoutes);
  console.log('SUCCESS: Service request routes loaded');
} catch (error) {
  console.error('FAILED: Service request routes');
  console.error('Error:', error.message);
  process.exit(1);
}

try {
  console.log('[5/9] Loading messaging routes...');
  const messageRoutes = require('./routes/messaging');
  app.use('/api/messaging', messageRoutes);
  console.log('SUCCESS: Messaging routes loaded');
} catch (error) {
  console.error('FAILED: Messaging routes');
  console.error('Error:', error.message);
  process.exit(1);
}

try {
  console.log('[6/9] Loading chatbot routes...');
  const chatbotRoutes = require('./routes/chatbot');
  app.use('/api/chatbot', chatbotRoutes);
  console.log('SUCCESS: Chatbot routes loaded');
} catch (error) {
  console.error('FAILED: Chatbot routes');
  console.error('Error:', error.message);
  process.exit(1);
}

try {
  console.log('[7/9] Loading account settings routes...');
  const accountSettingsRoutes = require('./routes/accountSettings');
  app.use('/api/account', accountSettingsRoutes);
  console.log('SUCCESS: Account settings routes loaded');
} catch (error) {
  console.error('FAILED: Account settings routes');
  console.error('Error:', error.message);
  process.exit(1);
}

try {
  console.log('[8/9] Loading payment routes...');
  const paymentRoutes = require('./routes/payment');
  app.use('/api/payments', paymentRoutes);
  console.log('SUCCESS: Payment routes loaded');
} catch (error) {
  console.error('FAILED: Payment routes');
  console.error('Error:', error.message);
  process.exit(1);
}

try {
  console.log('[9/9] Loading notification routes...');
  const notificationRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationRoutes);
  console.log('SUCCESS: Notification routes loaded');
} catch (error) {
  console.error('FAILED: Notification routes');
  console.error('Error:', error.message);
  process.exit(1);
}

console.log('==========================================');
console.log('All routes loaded successfully!');
console.log('==========================================');

app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

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

/*require('dotenv').config();
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
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight requests for 10 minutes
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - logs all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.get('origin') || 'no origin'}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);  
app.use('/api/admin', adminRoutes);
app.use('/api', healthRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/messaging', messageRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/account', accountSettingsRoutes); 
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

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

module.exports = app;*/