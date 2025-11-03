// ============================================================================
// PAYMENT NOTIFICATION TESTING SCRIPT
// ============================================================================
// This script helps you test the payment notification system
// Run this after implementing the payment notification scheduler
//
// Usage: node testPaymentNotifications.js
// ============================================================================

require("dotenv").config();

const pool = require("./config/database");
const {
  checkPaymentDueDates,
  notifyPaymentDeadlineSet,
} = require("./paymentNotificationScheduler");

// Test colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  title: (msg) =>
    console.log(
      `\n${colors.bright}${colors.blue}${"=".repeat(70)}\n${msg}\n${"=".repeat(
        70
      )}${colors.reset}\n`
    ),
};

// Check when the last overdue notification was sent for a payment
const getLastOverdueNotificationDate = async (paymentId) => {
  try {
    const result = await pool.query(
      `
      SELECT MAX(created_at) as last_sent
      FROM notifications
      WHERE subject LIKE '%Overdue%'
        AND subject LIKE '%' || (
          SELECT request_number 
          FROM service_requests sr
          JOIN payments p ON sr.request_id = p.request_id
          WHERE p.payment_id = $1
        ) || '%'
    `,
      [paymentId]
    );

    return result.rows[0]?.last_sent
      ? new Date(result.rows[0].last_sent)
      : null;
  } catch (error) {
    console.error("Error checking last overdue notification:", error);
    return null;
  }
};

// Test overdue notifications across multiple days for ALL overdue payments
async function testOverdueTimeline(startDate, endDate) {
  log.title(`🧪 TESTING OVERDUE TIMELINE FOR ALL PAYMENTS`);
  log.info(`Testing from ${startDate} to ${endDate}\n`);
  
  try {
    // Get all pending payments
    const paymentsResult = await pool.query(`
      SELECT 
        p.payment_id,
        p.payment_phase,
        p.amount,
        p.due_date,
        sr.request_number,
        sr.requested_by_user_id as customer_id
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.status = 'Pending'
        AND p.due_date IS NOT NULL
        AND sr.payment_deadline IS NOT NULL
      ORDER BY p.due_date ASC
    `);
    
    if (paymentsResult.rows.length === 0) {
      log.error('No pending payments found');
      return;
    }
    
    log.info(`Found ${paymentsResult.rows.length} pending payments\n`);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Test each payment
    for (const payment of paymentsResult.rows) {
      const due = new Date(payment.due_date);
      
      // Only show if it's overdue within the test range
      const endDaysOverdue = Math.floor((end - due) / (1000 * 60 * 60 * 24));
      
      if (endDaysOverdue < 0) continue; // Not overdue yet
      
      log.warning(`\n${payment.request_number} - ${payment.payment_phase} - ₱${parseFloat(payment.amount).toLocaleString()} (Due: ${payment.due_date})`);
      
      let testResults = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const testDate = new Date(d);
        testDate.setHours(0, 0, 0, 0);
        
        const daysOverdue = Math.floor((testDate - due) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue >= 0) {
          // Check if notification would be sent
          const lastOverdueSent = await getLastOverdueNotificationDate(payment.payment_id);
          
          let wouldSend = false;
          
          if (!lastOverdueSent) {
            wouldSend = true;
          } else {
            const daysSinceLastNotification = Math.floor((testDate - lastOverdueSent) / (1000 * 60 * 60 * 24));
            if (daysSinceLastNotification >= 1) { // Your interval setting
              wouldSend = true;
            }
          }
          
          testResults.push({
            date: testDate.toISOString().split('T')[0],
            daysOverdue,
            wouldSend
          });
        }
      }
      
      // Display results for this payment
      console.log('  Date          | Days Overdue | Notification');
      console.log('  ' + '─'.repeat(55));
      testResults.forEach(r => {
        const status = r.wouldSend ? '✅ SEND' : '⏭️  SKIP';
        console.log(`  ${r.date} | ${r.daysOverdue.toString().padStart(12)} | ${status}`);
      });
      
      const totalWouldSend = testResults.filter(r => r.wouldSend).length;
      log.info(`  → Would send ${totalWouldSend} overdue notification(s) for this payment`);
    }
    
  } catch (error) {
    log.error(`Timeline test failed: ${error.message}`);
    console.error(error);
  }
}

// ============================================================================
// Test 1: Verify Database Structure
// ============================================================================
async function testDatabaseStructure() {
  log.title("TEST 1: Verifying Database Structure");

  try {
    // Check if payments table has due_date column
    const paymentsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
        AND column_name IN ('payment_id', 'due_date', 'status', 'request_id')
    `);

    if (paymentsCheck.rows.length === 4) {
      log.success("Payments table structure is correct");
    } else {
      log.error("Payments table is missing required columns");
      return false;
    }

    // Check service_requests has payment_deadline column
    const requestsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service_requests' 
        AND column_name = 'payment_deadline'
    `);

    if (requestsCheck.rows.length === 1) {
      log.success("Service requests table has payment_deadline column");
    } else {
      log.warning("Service requests table missing payment_deadline column");
    }

    // Check notifications table
    const notificationsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
        AND column_name IN ('notification_id', 'notification_type', 'recipient_user_id', 'status')
    `);

    if (notificationsCheck.rows.length === 4) {
      log.success("Notifications table structure is correct");
    } else {
      log.error("Notifications table is missing required columns");
      return false;
    }

    return true;
  } catch (error) {
    log.error(`Database structure check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Test 2: Check Pending Payments (WITH DEADLINES ONLY)
// ============================================================================
async function testPendingPayments() {
  log.title("TEST 2: Checking Pending Payments (WITH DEADLINES)");

  try {
    // ✅ Updated query to match the scheduler's filtering
    const result = await pool.query(`
      SELECT 
        p.payment_id,
        p.payment_phase,
        p.amount,
        p.due_date,
        p.status,
        sr.request_number,
        sr.payment_deadline,
        CURRENT_DATE - p.due_date as days_overdue,
        p.due_date - CURRENT_DATE as days_until_due
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.status = 'Pending' 
        AND p.due_date IS NOT NULL
        AND sr.payment_deadline IS NOT NULL
      ORDER BY p.due_date ASC
      LIMIT 10
    `);

    log.info(`Found ${result.rows.length} pending payments WITH deadlines`);

    // Also show how many don't have deadlines (for info)
    const noDeadlineResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      WHERE p.status = 'Pending' 
        AND (p.due_date IS NULL OR sr.payment_deadline IS NULL)
    `);

    const noDeadlineCount = parseInt(noDeadlineResult.rows[0].count);
    if (noDeadlineCount > 0) {
      log.info(
        `(${noDeadlineCount} pending payments WITHOUT deadlines - these will be SKIPPED)`
      );
    }

    if (result.rows.length === 0) {
      log.warning("No pending payments WITH deadlines found.");
      log.info(
        "💡 Set payment deadlines for service requests to test notifications"
      );
      return false;
    }

    // Categorize payments
    const overdue = result.rows.filter((p) => parseInt(p.days_until_due) < 0);
    const dueToday = result.rows.filter(
      (p) => parseInt(p.days_until_due) === 0
    );
    const dueIn3Days = result.rows.filter(
      (p) => parseInt(p.days_until_due) === 3
    );
    const dueIn7Days = result.rows.filter(
      (p) => parseInt(p.days_until_due) === 7
    );
    const upcoming = result.rows.filter(
      (p) =>
        parseInt(p.days_until_due) > 0 &&
        ![3, 7].includes(parseInt(p.days_until_due))
    );

    log.info(`  • Overdue: ${overdue.length}`);
    log.info(`  • Due Today: ${dueToday.length}`);
    log.info(`  • Due in 3 Days: ${dueIn3Days.length}`);
    log.info(`  • Due in 7 Days: ${dueIn7Days.length}`);
    log.info(`  • Upcoming: ${upcoming.length}`);

    // Show details of actionable payments
    if (overdue.length > 0) {
      log.warning("\nOverdue Payments:");
      overdue.forEach((p) => {
        console.log(
          `    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(
            p.amount
          ).toLocaleString()} - Overdue by ${Math.abs(p.days_until_due)} days`
        );
      });
    }

    if (dueToday.length > 0) {
      log.warning("\nPayments Due Today:");
      dueToday.forEach((p) => {
        console.log(
          `    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(
            p.amount
          ).toLocaleString()}`
        );
      });
    }

    if (dueIn3Days.length > 0) {
      log.info("\nPayments Due in 3 Days:");
      dueIn3Days.forEach((p) => {
        console.log(
          `    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(
            p.amount
          ).toLocaleString()}`
        );
      });
    }

    if (dueIn7Days.length > 0) {
      log.info("\nPayments Due in 7 Days:");
      dueIn7Days.forEach((p) => {
        console.log(
          `    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(
            p.amount
          ).toLocaleString()}`
        );
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
  log.title("TEST 3: Checking Recent Payment Notifications");

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
      WHERE notification_type = 'Payment'
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 20
    `);

    log.info(
      `Found ${result.rows.length} payment notifications in last 7 days`
    );

    if (result.rows.length > 0) {
      // Group by category
      const categories = {};
      result.rows.forEach((n) => {
        if (!categories[n.category]) categories[n.category] = 0;
        categories[n.category]++;
      });

      console.log("\nNotification Breakdown:");
      Object.entries(categories).forEach(([category, count]) => {
        log.info(`  • ${category}: ${count}`);
      });

      console.log("\nRecent Notifications:");
      result.rows.slice(0, 5).forEach((n) => {
        const date = new Date(n.created_at).toLocaleString();
        console.log(`    ${date} - ${n.subject.substring(0, 60)}...`);
      });
    } else {
      log.warning("No payment notifications found in last 7 days");
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
  log.title("TEST 4: Testing Notification Function");

  try {
    log.info("Getting a test service request...");

    const requestResult = await pool.query(`
      SELECT request_id, request_number
      FROM service_requests
      WHERE requested_by_user_id IS NOT NULL
      LIMIT 1
    `);

    if (requestResult.rows.length === 0) {
      log.warning("No service requests found to test with");
      return false;
    }

    const testRequest = requestResult.rows[0];
    log.info(`Using request: ${testRequest.request_number}`);

    // Test notifyPaymentDeadlineSet function
    log.info("Testing notifyPaymentDeadlineSet function...");
    const testDueDate = new Date();
    testDueDate.setDate(testDueDate.getDate() + 7);

    await notifyPaymentDeadlineSet(
      testRequest.request_id,
      "Test Payment",
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
      log.success("Notification function works! Test notification created.");
      log.info(`Subject: ${notifCheck.rows[0].subject}`);
    } else {
      log.error("Notification function did not create a notification");
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
  log.title("TEST 5: Running Manual Payment Check");

  try {
    log.info("Calling checkPaymentDueDates()...\n");
    log.info("This will ONLY process payments with deadlines set");
    log.info("Payments without deadlines will be SKIPPED\n");

    // This will run the actual payment check function
    await checkPaymentDueDates();

    log.success("\nPayment check completed successfully!");
    log.info("Check console output above for detailed results");

    return true;
  } catch (error) {
    log.error(`Payment check failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

// ============================================================================
// Test 6: Check for Duplicate Notifications
// ============================================================================
async function testDuplicates() {
  log.title("TEST 6: Checking for Duplicate Notifications");

  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        subject,
        recipient_user_id,
        COUNT(*) as count
      FROM notifications
      WHERE notification_type = 'Payment'
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at), subject, recipient_user_id
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);

    if (result.rows.length === 0) {
      log.success("No duplicate notifications found");
    } else {
      log.warning(`Found ${result.rows.length} potential duplicates:`);
      result.rows.forEach((d) => {
        console.log(
          `    ${d.date} - User ${d.recipient_user_id} - ${d.subject.substring(
            0,
            50
          )} (${d.count} times)`
        );
      });
    }

    return true;
  } catch (error) {
    log.error(`Duplicate check failed: ${error.message}`);
    return false;
  }
}

// ============================================================================
// Create Test Data (WITH DEADLINES)
// ============================================================================
async function createTestData() {
  log.title("BONUS: Creating Test Payment Data WITH DEADLINES");

  try {
    log.info("This will create test payments with various due dates");
    log.warning("Only run this if you need test data!");

    // Get a test request
    const requestResult = await pool.query(`
      SELECT sr.request_id, sr.request_number
      FROM service_requests sr
      WHERE sr.requested_by_user_id IS NOT NULL
      LIMIT 1
    `);

    if (requestResult.rows.length === 0) {
      log.error("No service requests found to create test payments");
      return false;
    }

    const requestId = requestResult.rows[0].request_id;
    const requestNumber = requestResult.rows[0].request_number;

    // ✅ Set payment deadline on the service request
    log.info(`Setting payment deadline on request ${requestNumber}...`);
    await pool.query(
      `
      UPDATE service_requests
      SET payment_deadline = CURRENT_DATE + INTERVAL '7 days'
      WHERE request_id = $1
    `,
      [requestId]
    );

    log.success("Payment deadline set on service request");

    // Create test payments
    const testPayments = [
      { phase: "Test - Due in 3 days", days: 3, amount: 5000 },
      { phase: "Test - Due today", days: 0, amount: 10000 },
      { phase: "Test - Overdue 2 days", days: -2, amount: 7500 },
      { phase: "Test - Due in 7 days", days: 7, amount: 15000 },
    ];

    for (const test of testPayments) {
      await pool.query(
        `
        INSERT INTO payments (request_id, payment_phase, amount, status, due_date)
        VALUES ($1, $2, $3, 'Pending', CURRENT_DATE + INTERVAL '${test.days} days')
      `,
        [requestId, test.phase, test.amount]
      );

      log.success(`Created: ${test.phase}`);
    }

    log.success("\nTest data created successfully!");
    log.info(`All test payments linked to request: ${requestNumber}`);
    log.info("You can now run the tests again to see notifications");

    return true;
  } catch (error) {
    log.error(`Test data creation failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function runAllTests() {
  console.clear();
  log.title("🧪 PAYMENT NOTIFICATION SYSTEM - TEST SUITE");

  const results = {
    passed: 0,
    failed: 0,
  };

  // Run all tests
  const tests = [
    { name: "Database Structure", fn: testDatabaseStructure },
    { name: "Pending Payments", fn: testPendingPayments },
    { name: "Recent Notifications", fn: testRecentNotifications },
    { name: "Notification Function", fn: testNotificationFunction },
    { name: "Manual Payment Check", fn: testPaymentCheck },
    { name: "Duplicate Check", fn: testDuplicates },
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
  log.title("📊 TEST SUMMARY");
  log.success(`Passed: ${results.passed}/${tests.length}`);
  if (results.failed > 0) {
    log.error(`Failed: ${results.failed}/${tests.length}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ Test suite completed!");
  console.log("=".repeat(70) + "\n");

  log.info(
    "💡 IMPORTANT: Only payments with deadlines set will trigger notifications"
  );
  log.info("💡 Requests without payment_deadline will be SKIPPED");

  // Offer to create test data if no pending payments
  if (results.failed > 0) {
    log.info(
      "\n💡 TIP: If you need test data, run: node testPaymentNotifications.js --create-test-data"
    );
  }

  // Properly close the database connection after a delay
  console.log("\n✅ Closing database connection...");
  setTimeout(async () => {
    try {
      await pool.end();
      console.log("✅ Database connection closed successfully");
      process.exit(results.failed > 0 ? 1 : 0);
    } catch (err) {
      console.error("❌ Error closing pool:", err);
      process.exit(1);
    }
  }, 1000);
}

// ============================================================================
// Test with Specific Date
// ============================================================================
async function testWithSpecificDate(testDate) {
  log.title(`🧪 TESTING WITH SPECIFIC DATE: ${testDate}`);

  try {
    log.info("Temporarily overriding CURRENT_DATE for testing...");
    log.warning(
      "This will show what notifications WOULD be sent on that date\n"
    );

    // Override the checkPaymentDueDates function to use test date
    const originalCheckPaymentDueDates =
      require("./paymentNotificationScheduler").checkPaymentDueDates;

    // Get payments as if it were the test date
    const result = await pool.query(`
      SELECT 
        p.payment_id,
        p.payment_phase,
        p.amount,
        p.due_date,
        p.status,
        sr.request_id,
        sr.request_number,
        sr.requested_by_user_id as customer_id,
        sr.assigned_to_staff_id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email,
        CONCAT(staff.first_name, ' ', staff.last_name) as assigned_staff_name,
        staff.email as assigned_staff_email,
        p.due_date - DATE '${testDate}' as days_until_due
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      JOIN users u ON sr.requested_by_user_id = u.user_id
      LEFT JOIN users staff ON sr.assigned_to_staff_id = staff.user_id
      WHERE p.status = 'Pending' 
        AND p.due_date IS NOT NULL
        AND sr.payment_deadline IS NOT NULL
      ORDER BY p.due_date ASC
    `);

    log.info(`Found ${result.rows.length} pending payments to check`);

    const payments = result.rows;

    // Categorize payments
    const overdue = payments.filter((p) => parseInt(p.days_until_due) < 0);
    const dueToday = payments.filter((p) => parseInt(p.days_until_due) === 0);
    const dueIn3Days = payments.filter((p) => parseInt(p.days_until_due) === 3);
    const dueIn7Days = payments.filter((p) => parseInt(p.days_until_due) === 7);

    log.info(`\n📊 Notification Summary for ${testDate}:`);
    log.info(`  • Would notify OVERDUE: ${overdue.length} payments`);
    log.info(`  • Would notify DUE TODAY: ${dueToday.length} payments`);
    log.info(`  • Would notify DUE IN 3 DAYS: ${dueIn3Days.length} payments`);
    log.info(`  • Would notify DUE IN 7 DAYS: ${dueIn7Days.length} payments`);

    console.log("\n" + "=".repeat(70));

    if (overdue.length > 0) {
      log.warning("\n⚠️  OVERDUE Notifications:");

      for (const p of overdue) {
        const lastOverdueSent = await getLastOverdueNotificationDate(
          p.payment_id
        );
        const testDate = new Date(args[dateIndex + 1]);
        testDate.setHours(0, 0, 0, 0);

        let wouldSend = false;
        let reason = "";

        if (!lastOverdueSent) {
          wouldSend = true;
          reason = "(FIRST overdue notification)";
        } else {
          const daysSinceLastNotification = Math.floor(
            (testDate - lastOverdueSent) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastNotification >= 1) {
            wouldSend = true;
            reason = `(${daysSinceLastNotification} days since last notification)`;
          } else {
            reason = `(Last sent ${daysSinceLastNotification} days ago - WOULD SKIP)`;
          }
        }

        const status = wouldSend ? "✅ WOULD SEND" : "⏭️  WOULD SKIP";
        console.log(
          `    ${status} ${p.request_number} - ${
            p.payment_phase
          } - ₱${parseFloat(p.amount).toLocaleString()} - Due: ${
            p.due_date
          } (${Math.abs(p.days_until_due)} days overdue) ${reason}`
        );
      }
    }

    if (dueToday.length > 0) {
      log.warning("\n🔔 DUE TODAY Notifications:");
      dueToday.forEach((p) => {
        console.log(
          `    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(
            p.amount
          ).toLocaleString()} - Due: ${p.due_date}`
        );
      });
    }

    if (dueIn3Days.length > 0) {
      log.info("\n⏰ DUE IN 3 DAYS Notifications:");
      dueIn3Days.forEach((p) => {
        console.log(
          `    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(
            p.amount
          ).toLocaleString()} - Due: ${p.due_date}`
        );
      });
    }

    if (dueIn7Days.length > 0) {
      log.info("\n📅 DUE IN 7 DAYS Notifications:");
      dueIn7Days.forEach((p) => {
        console.log(
          `    ${p.request_number} - ${p.payment_phase} - ₱${parseFloat(
            p.amount
          ).toLocaleString()} - Due: ${p.due_date}`
        );
      });
    }

    const totalNotifications =
      overdue.length + dueToday.length + dueIn3Days.length + dueIn7Days.length;

    console.log("\n" + "=".repeat(70));
    log.success(
      `\n✅ Total notifications that would be sent: ${
        totalNotifications * 2
      } (client + staff for each)`
    );
    log.info(
      "💡 Run without --date to actually send notifications for today\n"
    );
  } catch (error) {
    log.error(`Test with specific date failed: ${error.message}`);
    console.error(error);
  } finally {
    setTimeout(async () => {
      await pool.end();
      process.exit(0);
    }, 500);
  }
}

// ============================================================================
// CLI Argument Handling
// ============================================================================
const args = process.argv.slice(2);

// Check for --date argument
const dateIndex = args.findIndex((arg) => arg === "--date" || arg === "-d");
if (dateIndex !== -1 && args[dateIndex + 1]) {
  const testDate = args[dateIndex + 1];

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
    log.error("Invalid date format. Use YYYY-MM-DD (e.g., 2025-11-05)");
    process.exit(1);
  }

  testWithSpecificDate(testDate);
} else if (args.includes("--create-test-data") || args.includes("-c")) {
  createTestData().then(() => {
    log.info("\nRun tests again to see notifications!");
    setTimeout(async () => {
      await pool.end();
      process.exit(0);
    }, 500);
  });
} else if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Payment Notification Test Suite

Usage:
  node testPaymentNotifications.js                    Run all tests (uses today's date)
  node testPaymentNotifications.js -d 2025-11-05      Test what notifications would be sent on a specific date
  node testPaymentNotifications.js --date 2025-11-05  Same as above
  node testPaymentNotifications.js -c                 Create test data
  node testPaymentNotifications.js --help             Show this help

Tests:
  1. Database Structure   - Verify tables and columns exist
  2. Pending Payments     - Show payments WITH deadlines that need notifications
  3. Recent Notifications - Check last 7 days of notifications
  4. Notification Function- Test creating a notification
  5. Manual Payment Check - Run the scheduler manually
  6. Duplicate Check      - Look for duplicate notifications

Testing with Specific Date:
  node testPaymentNotifications.js --date 2025-11-05
  
  This will show what notifications WOULD be sent on that date WITHOUT actually sending them.
  Useful for testing:
    • What happens on a specific future date
    • What would have happened on a past date
    • If your date logic is working correctly

Important:
  ✅ Only processes payments where service_requests.payment_deadline IS NOT NULL
  ✅ Skips legacy test requests without deadlines
  ✅ Prevents duplicate notifications
  
Examples:
  # Test notifications for November 5, 2025
  node testPaymentNotifications.js --date 2025-11-05
  
  # Test notifications for a past date
  node testPaymentNotifications.js --date 2025-10-28
  
  # Actually run the checker for TODAY
  node testPaymentNotifications.js
  `);
  process.exit(0);

} else if (args.includes('--timeline') || args.includes('-t')) {
  const startIndex = args.findIndex(arg => arg === '--start');
  const endIndex = args.findIndex(arg => arg === '--end');
  
  if (startIndex === -1 || endIndex === -1) {
    log.error('Timeline test requires --start and --end dates');
    log.info('Example: node testPaymentNotifications.js --timeline --start 2025-11-01 --end 2025-11-05');
    process.exit(1);
  }
  
  const startDate = args[startIndex + 1];
  const endDate = args[endIndex + 1];
  
  testOverdueTimeline(startDate, endDate).then(() => {
    setTimeout(async () => {
      await pool.end();
      process.exit(0);
    }, 500);
  });
} else {
  runAllTests();
}
