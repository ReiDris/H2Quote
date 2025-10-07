require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
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

// CORS configuration - allows multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://h2-quote.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - More specific routes FIRST
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);  
app.use('/api/admin', adminRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/messaging', messageRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/account', accountSettingsRoutes); 
app.use('/api/payments', paymentRoutes);
app.use('/api', healthRoutes); // Health routes last

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    console.log('404 - Route not found:', req.method, req.path);
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => {
    console.log(`H2Quote server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Allowed origins:`, allowedOrigins);
});

module.exports = app;