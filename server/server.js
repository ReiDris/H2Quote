console.log('=== SERVER.JS STARTING ===');
console.log('Step 1: Loading dotenv...');
require('dotenv').config();
console.log('✅ dotenv loaded\n');

console.log('Step 2: Loading express...');
const express = require('express');
console.log('✅ express loaded\n');

console.log('Step 3: Loading cors...');
const cors = require('cors');
console.log('✅ cors loaded\n');

console.log('Step 4: Creating app...');
const app = express();
console.log('✅ app created\n');

console.log('Step 5: Setting up middleware...');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✅ middleware configured\n');

// NOW test each route file ONE BY ONE
console.log('===========================================');
console.log('TESTING ROUTE FILES ONE BY ONE');
console.log('===========================================\n');

console.log('TEST 1: googleOAuth');
try {
  require('./routes/googleOAuth');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/googleOAuth.js\n');
  process.exit(1);
}

console.log('TEST 2: admin');
try {
  require('./routes/admin');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/admin.js\n');
  process.exit(1);
}

console.log('TEST 3: health');
try {
  require('./routes/health');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/health.js\n');
  process.exit(1);
}

console.log('TEST 4: serviceRequests');
try {
  require('./routes/serviceRequests');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/serviceRequests.js\n');
  process.exit(1);
}

console.log('TEST 5: messaging');
try {
  require('./routes/messaging');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/messaging.js\n');
  process.exit(1);
}

console.log('TEST 6: chatbot');
try {
  require('./routes/chatbot');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/chatbot.js\n');
  process.exit(1);
}

console.log('TEST 7: accountSettings');
try {
  require('./routes/accountSettings');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/accountSettings.js\n');
  process.exit(1);
}

console.log('TEST 8: payment');
try {
  require('./routes/payment');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/payment.js\n');
  process.exit(1);
}

console.log('TEST 9: notifications');
try {
  require('./routes/notifications');
  console.log('  ✅ PASSED\n');
} catch (e) {
  console.log('  ❌ FAILED');
  console.log('  Error:', e.message);
  console.log('  File: routes/notifications.js\n');
  process.exit(1);
}

console.log('===========================================');
console.log('✅ ALL TESTS PASSED!');
console.log('===========================================\n');

console.log('Now registering routes...\n');

const authRoutes = require('./routes/googleOAuth');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const serviceRequestRoutes = require('./routes/serviceRequests');
const messageRoutes = require('./routes/messaging');
const chatbotRoutes = require('./routes/chatbot');
const accountSettingsRoutes = require('./routes/accountSettings');
const paymentRoutes = require('./routes/payment');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', healthRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/messaging', messageRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/account', accountSettingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

console.log('✅ All routes registered!\n');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}\n`);
});

module.exports = app;