require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Environment variable validation
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

console.log('\n🔍 LOADING ROUTES WITH ERROR DETECTION...\n');

// Load and register routes with error handling
const routes = [
  { name: 'googleOAuth', path: './routes/googleOAuth', mount: '/api/auth' },
  { name: 'admin', path: './routes/admin', mount: '/api/admin' },
  { name: 'health', path: './routes/health', mount: '/api' },
  { name: 'serviceRequests', path: './routes/serviceRequests', mount: '/api/service-requests' },
  { name: 'messaging', path: './routes/messaging', mount: '/api/messaging' },
  { name: 'chatbot', path: './routes/chatbot', mount: '/api/chatbot' },
  { name: 'accountSettings', path: './routes/accountSettings', mount: '/api/account' },
  { name: 'payment', path: './routes/payment', mount: '/api/payments' },
  { name: 'notifications', path: './routes/notifications', mount: '/api/notifications' }
];

for (const route of routes) {
  try {
    console.log(`Loading ${route.name}...`);
    const routeModule = require(route.path);
    console.log(`  ✅ Loaded successfully`);
    
    console.log(`  Registering at ${route.mount}...`);
    app.use(route.mount, routeModule);
    console.log(`  ✅ Registered successfully\n`);
  } catch (error) {
    console.error(`\n❌❌❌ ERROR IN ${route.name} (${route.path}) ❌❌❌`);
    console.error(`Error Type: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`\nFull Stack Trace:`);
    console.error(error.stack);
    console.error(`\n❌❌❌ Fix this route file before continuing! ❌❌❌\n`);
    process.exit(1);
  }
}

console.log('✅ ALL ROUTES LOADED AND REGISTERED SUCCESSFULLY!\n');

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Runtime Error:', error.message);
    
    if (error.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS policy violation'
        });
    }
    
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
    console.log(`🚀 H2Quote Server`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Server is running\n`);
});

module.exports = app;