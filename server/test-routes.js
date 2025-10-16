console.log('Testing route files...');

try {
  console.log('1. Testing auth routes...');
  require('./routes/googleOAuth');
  console.log('   ✓ Auth routes OK');
} catch (e) {
  console.log('   ✗ Auth routes FAILED:', e.message);
  process.exit(1);
}

try {
  console.log('2. Testing admin routes...');
  require('./routes/admin');
  console.log('   ✓ Admin routes OK');
} catch (e) {
  console.log('   ✗ Admin routes FAILED:', e.message);
  process.exit(1);
}

try {
  console.log('3. Testing health routes...');
  require('./routes/health');
  console.log('   ✓ Health routes OK');
} catch (e) {
  console.log('   ✗ Health routes FAILED:', e.message);
  process.exit(1);
}

try {
  console.log('4. Testing service request routes...');
  require('./routes/serviceRequests');
  console.log('   ✓ Service request routes OK');
} catch (e) {
  console.log('   ✗ Service request routes FAILED:', e.message);
  process.exit(1);
}

try {
  console.log('5. Testing messaging routes...');
  require('./routes/messaging');
  console.log('   ✓ Messaging routes OK');
} catch (e) {
  console.log('   ✗ Messaging routes FAILED:', e.message);
  process.exit(1);
}

try {
  console.log('6. Testing chatbot routes...');
  require('./routes/chatbot');
  console.log('   ✓ Chatbot routes OK');
} catch (e) {
  console.log('   ✗ Chatbot routes FAILED:', e.message);
  process.exit(1);
}

try {
  console.log('7. Testing account settings routes...');
  require('./routes/accountSettings');
  console.log('   ✓ Account settings routes OK');
} catch (e) {
  console.log('   ✗ Account settings routes FAILED:', e.message);
  process.exit(1);
}

try {
  console.log('8. Testing payment routes...');
  require('./routes/payment');
  console.log('   ✓ Payment routes OK');
} catch (e) {
  console.log('   ✗ Payment routes FAILED:', e.message);
  process.exit(1);
}

try {
  console.log('9. Testing notification routes...');
  require('./routes/notifications');
  console.log('   ✓ Notification routes OK');
} catch (e) {
  console.log('   ✗ Notification routes FAILED:', e.message);
  process.exit(1);
}

console.log('\nAll route files loaded successfully!');