require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 🔍 COMMENT OUT ROUTES ONE BY ONE TO FIND THE PROBLEM
const authRoutes = require('./routes/googleOAuth');
// const adminRoutes = require('./routes/admin');
// const healthRoutes = require('./routes/health');
// const serviceRequestRoutes = require('./routes/serviceRequests');
// const messageRoutes = require('./routes/messaging');
// const chatbotRoutes = require('./routes/chatbot');
// const accountSettingsRoutes = require('./routes/accountSettings'); 
// const paymentRoutes = require('./routes/payment');
// const notificationRoutes = require('./routes/notifications');

const app = express();

if (!process.env.JWT_SECRET || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || 
    !process.env.SUPABASE_DB_HOST || !process.env.SUPABASE_DB_PASSWORD) {
    console.error('Missing required environment variables');
    console.log('Required variables: JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_DB_HOST, SUPABASE_DB_PASSWORD');
    process.exit(1);
}

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

console.log('🎉 All route files loaded successfully!');
console.log('Now registering routes...');

app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api', healthRoutes);
// app.use('/api/service-requests', serviceRequestRoutes);
// app.use('/api/messaging', messageRoutes);
// app.use('/api/chatbot', chatbotRoutes);
// app.use('/api/account', accountSettingsRoutes); 
// app.use('/api/payments', paymentRoutes);
// app.use('/api/notifications', notificationRoutes);

console.log('✅ Routes registered successfully!');

app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => {
    console.log(`H2Quote server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;