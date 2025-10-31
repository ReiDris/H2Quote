// ============================================================================
// PAYMENT NOTIFICATION TESTING SCRIPT
// ============================================================================
// This script helps you test the payment notification system
// Run this after implementing the payment notification scheduler
//
// Usage: node testPaymentNotifications.js
// ============================================================================

require('dotenv').config();

const pool = require('./config/database');
const { checkPaymentDueDates, notifyPaymentDeadlineSet } = require('./paymentNotificationScheduler');

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}${colors.reset}\n`)
};

// ============================================================================
// Test 1: Verify Database Structure
// ============================================================================
async function testDatabaseStructure() {
  log.title('TEST 1: Verifying Database Structure');
  
  try {
    // Check if payments table has due_date column
    const paymentsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
        AND column_name IN ('payment_id', 'due_date', 'status', 'request_id')
    `);
    
    if (paymentsCheck.rows.length === 4) {
      log.success('Payments table structure is correct');
    } else {
      log.error('Payments table is missing required columns');
      return false;
    }
    
    // Check notifications table
    const notificationsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
        AND column_name IN ('notification_id', 'notification_type', 'recipient_user_id', 'status')
    `);
    
    if (notificationsCheck.rows.length === 4) {
      log.success('Notifications table structure is correct');
    } else {
      log.error('Notifications table is missing required columns');
      return false;
    }
    
    return true;
    
  } catch (error) {
    log.error(`Database structure check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Test 2: Check Pending Payments
// ============================================================================
async function testPendingPayments() {
  log.title('TEST 2: Checking Pending Payments');
  
  try {
    const result = await pool.query(`
      SELECT 
        p.payment_id,
        p.payment_phase,
        p.amount,
        p.due_date,
        p.status,
        sr.request_number,
        CURRENT_DATE - p.due_date as days_overdue,
        p.due_date - CURRENT_DATE as days_until_due
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.status = 'Pending' AND p.due_date IS NOT NULL
      ORDER BY p.due_date ASC
      LIMIT 10
    `);
    
    log.info(`Found ${result.rows.length} pending payments with due dates`);
    
    if (result.rows.length === 0) {
      log.warning('No pending payments found. Create some test data to see notifications.');
      return false;
    }
    
    // Categorize payments
    const overdue = result.rows.filter(p => parseInt(p.days_until_due) < 0);
    const dueToday = result.rows.filter(p => parseInt(p.days_until_due) === 0);
    const dueIn3Days = result.rows.filter(p => parseInt(p.days_until_due) === 3);
    const upcoming = result.rows.filter(p => parseInt(p.days_until_due) > 0 && parseInt(p.days_until_due) !== 3);
    
    log.info(`  • Overdue: ${overdue.length}`);
    log.info(`  • Due Today: ${dueToday.length}`);
    log.info(`  • Due in 3 Days: ${dueIn3Days.length}`);
    log.info(`  • Upcoming: ${upcoming.length}`);
    
    // Show details of actionable payments
    if (overdue.length > 0) {
      log.warning('\nOverdue Payments:');
      overdue.forEach(p => {
        console.log(`    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(p.amount).toLocaleString()} - Overdue by ${Math.abs(p.days_until_due)} days`);
      });
    }
    
    if (dueToday.length > 0) {
      log.warning('\nPayments Due Today:');
      dueToday.forEach(p => {
        console.log(`    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(p.amount).toLocaleString()}`);
      });
    }
    
    if (dueIn3Days.length > 0) {
      log.info('\nPayments Due in 3 Days:');
      dueIn3Days.forEach(p => {
        console.log(`    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(p.amount).toLocaleString()}`);
      });
    }
    
    return true;
    
  } catch (error) {
    log.error(`Pending payments check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Test 3: Check Recent Notifications
// ============================================================================
async function testRecentNotifications() {
  log.title('TEST 3: Checking Recent Notifications');
  
  try {
    const result = await pool.query(`
      SELECT 
        notification_type,
        subject,
        status,
        created_at,
        CASE 
          WHEN subject LIKE '%Overdue%' THEN 'Overdue'
          WHEN subject LIKE '%Due Today%' THEN 'Due Today'
          WHEN subject LIKE '%Reminder%' THEN 'Reminder'
          WHEN subject LIKE '%Deadline Set%' THEN 'Deadline Set'
          ELSE 'Other'
        END as category
      FROM notifications
      WHERE notification_type = 'Service Request'
        AND (subject LIKE '%Payment%' OR subject LIKE '%Overdue%')
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    log.info(`Found ${result.rows.length} payment notifications in last 7 days`);
    
    if (result.rows.length > 0) {
      // Group by category
      const categories = {};
      result.rows.forEach(n => {
        if (!categories[n.category]) categories[n.category] = 0;
        categories[n.category]++;
      });
      
      console.log('\nNotification Breakdown:');
      Object.entries(categories).forEach(([category, count]) => {
        log.info(`  • ${category}: ${count}`);
      });
      
      console.log('\nRecent Notifications:');
      result.rows.slice(0, 5).forEach(n => {
        const date = new Date(n.created_at).toLocaleString();
        console.log(`    ${date} - ${n.subject.substring(0, 60)}...`);
      });
    } else {
      log.warning('No payment notifications found in last 7 days');
    }
    
    return true;
    
  } catch (error) {
    log.error(`Recent notifications check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Test 4: Test Notification Function
// ============================================================================
async function testNotificationFunction() {
  log.title('TEST 4: Testing Notification Function');
  
  try {
    log.info('Getting a test service request...');
    
    const requestResult = await pool.query(`
      SELECT request_id, request_number
      FROM service_requests
      WHERE requested_by_user_id IS NOT NULL
      LIMIT 1
    `);
    
    if (requestResult.rows.length === 0) {
      log.warning('No service requests found to test with');
      return false;
    }
    
    const testRequest = requestResult.rows[0];
    log.info(`Using request: ${testRequest.request_number}`);
    
    // Test notifyPaymentDeadlineSet function
    log.info('Testing notifyPaymentDeadlineSet function...');
    const testDueDate = new Date();
    testDueDate.setDate(testDueDate.getDate() + 7);
    
    await notifyPaymentDeadlineSet(
      testRequest.request_id,
      'Test Payment',
      testDueDate,
      5000
    );
    
    // Check if notification was created
    const notifCheck = await pool.query(`
      SELECT * FROM notifications
      WHERE subject LIKE '%${testRequest.request_number}%'
        AND created_at >= NOW() - INTERVAL '1 minute'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (notifCheck.rows.length > 0) {
      log.success('Notification function works! Test notification created.');
      log.info(`Subject: ${notifCheck.rows[0].subject}`);
    } else {
      log.error('Notification function did not create a notification');
      return false;
    }
    
    return true;
    
  } catch (error) {
    log.error(`Notification function test failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Test 5: Run Payment Check Manually
// ============================================================================
async function testPaymentCheck() {
  log.title('TEST 5: Running Manual Payment Check');
  
  try {
    log.info('Calling checkPaymentDueDates()...\n');
    
    // This will run the actual payment check function
    await checkPaymentDueDates();
    
    log.success('\nPayment check completed successfully!');
    log.info('Check console output above for detailed results');
    
    return true;
    
  } catch (error) {
    log.error(`Payment check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Test 6: Check for Duplicate Notifications
// ============================================================================
async function testDuplicates() {
  log.title('TEST 6: Checking for Duplicate Notifications');
  
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        subject,
        recipient_user_id,
        COUNT(*) as count
      FROM notifications
      WHERE notification_type = 'Service Request'
        AND (subject LIKE '%Payment%' OR subject LIKE '%Overdue%')
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at), subject, recipient_user_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    
    if (result.rows.length === 0) {
      log.success('No duplicate notifications found');
    } else {
      log.warning(`Found ${result.rows.length} potential duplicates:`);
      result.rows.forEach(d => {
        console.log(`    ${d.date} - User ${d.recipient_user_id} - ${d.subject.substring(0, 50)} (${d.count} times)`);
      });
    }
    
    return true;
    
  } catch (error) {
    log.error(`Duplicate check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Create Test Data
// ============================================================================
async function createTestData() {
  log.title('BONUS: Creating Test Payment Data');
  
  try {
    log.info('This will create test payments with various due dates');
    log.warning('Only run this if you need test data!');
    
    // Get a test request
    const requestResult = await pool.query(`
      SELECT request_id, request_number
      FROM service_requests
      LIMIT 1
    `);
    
    if (requestResult.rows.length === 0) {
      log.error('No service requests found to create test payments');
      return false;
    }
    
    const requestId = requestResult.rows[0].request_id;
    
    // Create test payments
    const testPayments = [
      { phase: 'Test - Due in 3 days', days: 3, amount: 5000 },
      { phase: 'Test - Due today', days: 0, amount: 10000 },
      { phase: 'Test - Overdue 2 days', days: -2, amount: 7500 },
      { phase: 'Test - Due in 7 days', days: 7, amount: 15000 }
    ];
    
    for (const test of testPayments) {
      await pool.query(`
        INSERT INTO payments (request_id, payment_phase, amount, status, due_date)
        VALUES ($1, $2, $3, 'Pending', CURRENT_DATE + INTERVAL '${test.days} days')
      `, [requestId, test.phase, test.amount]);
      
      log.success(`Created: ${test.phase}`);
    }
    
    log.success('\nTest data created successfully!');
    log.info('You can now run the tests again to see notifications');
    
    return true;
    
  } catch (error) {
    log.error(`Test data creation failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function runAllTests() {
  console.clear();
  log.title('🧪 PAYMENT NOTIFICATION SYSTEM - TEST SUITE');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Run all tests
  const tests = [
    { name: 'Database Structure', fn: testDatabaseStructure },
    { name: 'Pending Payments', fn: testPendingPayments },
    { name: 'Recent Notifications', fn: testRecentNotifications },
    { name: 'Notification Function', fn: testNotificationFunction },
    { name: 'Manual Payment Check', fn: testPaymentCheck },
    { name: 'Duplicate Check', fn: testDuplicates }
  ];
  
  for (const test of tests) {
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Summary
  log.title('📊 TEST SUMMARY');
  log.success(`Passed: ${results.passed}/${tests.length}`);
  if (results.failed > 0) {
    log.error(`Failed: ${results.failed}/${tests.length}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Test suite completed!');
  console.log('='.repeat(70) + '\n');
  
  // Offer to create test data if no pending payments
  if (results.failed > 0) {
    log.info('💡 TIP: If you need test data, run: node testPaymentNotifications.js --create-test-data');
  }
  
  // Properly close the database connection after a delay
  console.log('\n✅ Closing database connection...');
  setTimeout(async () => {
    try {
      await pool.end();
      console.log('✅ Database connection closed successfully');
      process.exit(results.failed > 0 ? 1 : 0);
    } catch (err) {
      console.error('❌ Error closing pool:', err);
      process.exit(1);
    }
  }, 1000);
}

// ============================================================================
// CLI Argument Handling
// ============================================================================
const args = process.argv.slice(2);

if (args.includes('--create-test-data') || args.includes('-c')) {
  createTestData().then(() => {
    log.info('\nRun tests again to see notifications!');
    setTimeout(async () => {
      await pool.end();
      process.exit(0);
    }, 500);
  });
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Payment Notification Test Suite

Usage:
  node testPaymentNotifications.js              Run all tests
  node testPaymentNotifications.js -c           Create test data
  node testPaymentNotifications.js --help       Show this help

Tests:
  1. Database Structure   - Verify tables and columns exist
  2. Pending Payments     - Show payments that need notifications
  3. Recent Notifications - Check last 7 days of notifications
  4. Notification Function- Test creating a notification
  5. Manual Payment Check - Run the scheduler manually
  6. Duplicate Check      - Look for duplicate notifications
  `);
  process.exit(0);
} else {
  runAllTests();
}