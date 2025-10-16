console.log('SERVER.JS STARTING...');

require('dotenv').config();
console.log('✅ dotenv loaded');

const express = require('express');
console.log('✅ express loaded');

const cors = require('cors');
console.log('✅ cors loaded');

const app = express();
console.log('✅ app created');

// Minimal middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('✅ middleware registered');

// Test each route file individually
console.log('\n🔍 Testing route files...\n');

console.log('1. Testing googleOAuth...');
try {
  const authRoutes = require('./routes/googleOAuth');
  console.log('   ✅ googleOAuth LOADED');
} catch (error) {
  console.error('   ❌ googleOAuth FAILED:', error.message);
  process.exit(1);
}

console.log('2. Testing admin...');
try {
  const adminRoutes = require('./routes/admin');
  console.log('   ✅ admin LOADED');
} catch (error) {
  console.error('   ❌ admin FAILED:', error.message);
  process.exit(1);
}

console.log('3. Testing health...');
try {
  const healthRoutes = require('./routes/health');
  console.log('   ✅ health LOADED');
} catch (error) {
  console.error('   ❌ health FAILED:', error.message);
  process.exit(1);
}

console.log('4. Testing serviceRequests...');
try {
  const serviceRequestRoutes = require('./routes/serviceRequests');
  console.log('   ✅ serviceRequests LOADED');
} catch (error) {
  console.error('   ❌ serviceRequests FAILED:', error.message);
  process.exit(1);
}

console.log('5. Testing messaging...');
try {
  const messageRoutes = require('./routes/messaging');
  console.log('   ✅ messaging LOADED');
} catch (error) {
  console.error('   ❌ messaging FAILED:', error.message);
  process.exit(1);
}

console.log('6. Testing chatbot...');
try {
  const chatbotRoutes = require('./routes/chatbot');
  console.log('   ✅ chatbot LOADED');
} catch (error) {
  console.error('   ❌ chatbot FAILED:', error.message);
  process.exit(1);
}

console.log('7. Testing accountSettings...');
try {
  const accountSettingsRoutes = require('./routes/accountSettings');
  console.log('   ✅ accountSettings LOADED');
} catch (error) {
  console.error('   ❌ accountSettings FAILED:', error.message);
  process.exit(1);
}

console.log('8. Testing payment...');
try {
  const paymentRoutes = require('./routes/payment');
  console.log('   ✅ payment LOADED');
} catch (error) {
  console.error('   ❌ payment FAILED:', error.message);
  process.exit(1);
}

console.log('9. Testing notifications...');
try {
  const notificationRoutes = require('./routes/notifications');
  console.log('   ✅ notifications LOADED');
} catch (error) {
  console.error('   ❌ notifications FAILED:', error.message);
  process.exit(1);
}

console.log('\n✅ ALL ROUTE FILES LOADED SUCCESSFULLY!');
console.log('This means the error happens during route REGISTRATION, not loading.\n');

// Now try registering them
console.log('Now testing route registration...\n');

const authRoutes = require('./routes/googleOAuth');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const serviceRequestRoutes = require('./routes/serviceRequests');
const messageRoutes = require('./routes/messaging');
const chatbotRoutes = require('./routes/chatbot');
const accountSettingsRoutes = require('./routes/accountSettings');
const paymentRoutes = require('./routes/payment');
const notificationRoutes = require('./routes/notifications');

console.log('Registering googleOAuth...');
app.use('/api/auth', authRoutes);
console.log('✅ googleOAuth registered');

console.log('Registering admin...');
app.use('/api/admin', adminRoutes);
console.log('✅ admin registered');

console.log('Registering health...');
app.use('/api', healthRoutes);
console.log('✅ health registered');

console.log('Registering serviceRequests...');
app.use('/api/service-requests', serviceRequestRoutes);
console.log('✅ serviceRequests registered');

console.log('Registering messaging...');
app.use('/api/messaging', messageRoutes);
console.log('✅ messaging registered');

console.log('Registering chatbot...');
app.use('/api/chatbot', chatbotRoutes);
console.log('✅ chatbot registered');

console.log('Registering accountSettings...');
app.use('/api/account', accountSettingsRoutes);
console.log('✅ accountSettings registered');

console.log('Registering payment...');
app.use('/api/payments', paymentRoutes);
console.log('✅ payment registered');

console.log('Registering notifications...');
app.use('/api/notifications', notificationRoutes);
console.log('✅ notifications registered');

console.log('\n🎉 ALL ROUTES REGISTERED! Server starting...\n');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;