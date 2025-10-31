const cron = require('node-cron');
const pool = require('./config/database');
const { createNotification } = require('./controllers/notificationController');

// Track sent notifications to prevent duplicates
const sentNotifications = new Map();

// Clean up old tracking entries (older than 7 days)
const cleanupTrackingData = () => {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (timestamp < sevenDaysAgo) {
      sentNotifications.delete(key);
    }
  }
};

// Generate unique notification key to prevent duplicates
const getNotificationKey = (paymentId, notificationType, recipientId, date) => {
  return `${paymentId}-${notificationType}-${recipientId}-${date}`;
};

// Check if notification was already sent today
const wasNotificationSent = (paymentId, notificationType, recipientId) => {
  const today = new Date().toISOString().split('T')[0];
  const key = getNotificationKey(paymentId, notificationType, recipientId, today);
  return sentNotifications.has(key);
};

// Mark notification as sent
const markNotificationSent = (paymentId, notificationType, recipientId) => {
  const today = new Date().toISOString().split('T')[0];
  const key = getNotificationKey(paymentId, notificationType, recipientId, today);
  sentNotifications.set(key, Date.now());
};

// Send payment notification to client
const notifyClient = async (payment, notificationType, messageTemplate) => {
  const key = `client-${payment.payment_id}-${notificationType}`;
  
  if (wasNotificationSent(payment.payment_id, notificationType, payment.customer_id)) {
    console.log(`⏭️  Skipping duplicate notification for client (${key})`);
    return;
  }

  const message = messageTemplate
    .replace('{payment_phase}', payment.payment_phase)
    .replace('{request_number}', payment.request_number)
    .replace('{amount}', `₱${parseFloat(payment.amount).toLocaleString()}`)
    .replace('{due_date}', new Date(payment.due_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));

  try {
    await createNotification(
      payment.customer_id,
      'Payment',
      `Payment ${notificationType} - ${payment.request_number}`,
      message,
      payment.customer_email
    );
    
    markNotificationSent(payment.payment_id, notificationType, payment.customer_id);
    console.log(`✅ Client notification sent: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to notify client for ${key}:`, error);
  }
};

// Send payment notification to admin/staff
const notifyStaff = async (payment, notificationType, messageTemplate, recipientId, recipientEmail, recipientName) => {
  const key = `staff-${payment.payment_id}-${notificationType}-${recipientId}`;
  
  if (wasNotificationSent(payment.payment_id, notificationType, recipientId)) {
    console.log(`⏭️  Skipping duplicate notification for staff (${key})`);
    return;
  }

  const message = messageTemplate
    .replace('{payment_phase}', payment.payment_phase)
    .replace('{request_number}', payment.request_number)
    .replace('{customer_name}', payment.customer_name)
    .replace('{amount}', `₱${parseFloat(payment.amount).toLocaleString()}`)
    .replace('{due_date}', new Date(payment.due_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));

  try {
    await createNotification(
      recipientId,
      'Payment',
      `Payment ${notificationType} - ${payment.request_number}`,
      message,
      recipientEmail
    );
    
    markNotificationSent(payment.payment_id, notificationType, recipientId);
    console.log(`✅ Staff notification sent: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to notify staff for ${key}:`, error);
  }
};

// Main function to check payment due dates
const checkPaymentDueDates = async () => {
  console.log('\n🔔 Running payment notification check...');
  console.log(`📅 Current date: ${new Date().toISOString().split('T')[0]}`);
  
  try {
    // Get all pending payments with due dates
    const paymentsQuery = `
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
        staff.email as assigned_staff_email
      FROM payments p
      JOIN service_requests sr ON p.request_id = sr.request_id
      JOIN users u ON sr.requested_by_user_id = u.user_id
      LEFT JOIN users staff ON sr.assigned_to_staff_id = staff.user_id
      WHERE p.status = 'Pending' 
        AND p.due_date IS NOT NULL
        AND p.due_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY p.due_date ASC
    `;

    const result = await pool.query(paymentsQuery);
    const payments = result.rows;

    console.log(`📊 Found ${payments.length} pending payments to check`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let notificationsSent = 0;

    for (const payment of payments) {
      const dueDate = new Date(payment.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

      console.log(`\n💳 Checking payment #${payment.payment_id}:`);
      console.log(`   Request: ${payment.request_number}`);
      console.log(`   Phase: ${payment.payment_phase}`);
      console.log(`   Due: ${payment.due_date} (${daysUntilDue} days)`);

      // OVERDUE PAYMENT
      if (daysUntilDue < 0) {
        console.log(`   ⚠️  OVERDUE by ${Math.abs(daysUntilDue)} days`);
        
        // Notify client
        await notifyClient(
          payment,
          'Overdue',
          '⚠️ Your {payment_phase} for service request #{request_number} is now OVERDUE. Amount due: {amount}. Please make payment as soon as possible to avoid service delays.'
        );

        // Notify all admins
        const adminsQuery = `
          SELECT user_id, email, first_name, last_name 
          FROM users 
          WHERE user_type = 'admin' AND status = 'Active'
        `;
        const adminsResult = await pool.query(adminsQuery);

        for (const admin of adminsResult.rows) {
          await notifyStaff(
            payment,
            'Overdue',
            '⚠️ OVERDUE PAYMENT: {payment_phase} for request #{request_number} from {customer_name} is overdue. Amount: {amount}. Follow up required.',
            admin.user_id,
            admin.email,
            `${admin.first_name} ${admin.last_name}`
          );
        }

        // Notify assigned staff if exists
        if (payment.assigned_to_staff_id && payment.assigned_staff_email) {
          await notifyStaff(
            payment,
            'Overdue',
            '⚠️ OVERDUE PAYMENT: {payment_phase} for your assigned request #{request_number} from {customer_name} is overdue. Amount: {amount}. Please follow up with the client.',
            payment.assigned_to_staff_id,
            payment.assigned_staff_email,
            payment.assigned_staff_name
          );
        }

        notificationsSent++;
      }
      // DUE TODAY
      else if (daysUntilDue === 0) {
        console.log(`   🔔 DUE TODAY`);
        
        // Notify client
        await notifyClient(
          payment,
          'Due Today',
          '🔔 PAYMENT DUE TODAY: Your {payment_phase} for service request #{request_number} is due today. Amount: {amount}. Please process payment to avoid delays.'
        );

        // Notify all admins
        const adminsQuery = `
          SELECT user_id, email, first_name, last_name 
          FROM users 
          WHERE user_type = 'admin' AND status = 'Active'
        `;
        const adminsResult = await pool.query(adminsQuery);

        for (const admin of adminsResult.rows) {
          await notifyStaff(
            payment,
            'Due Today',
            '📋 PAYMENT DUE TODAY: Issue payment request for {payment_phase} on request #{request_number} from {customer_name}. Amount: {amount}.',
            admin.user_id,
            admin.email,
            `${admin.first_name} ${admin.last_name}`
          );
        }

        // Notify assigned staff if exists
        if (payment.assigned_to_staff_id && payment.assigned_staff_email) {
          await notifyStaff(
            payment,
            'Due Today',
            '📋 PAYMENT DUE TODAY: {payment_phase} for your assigned request #{request_number} from {customer_name} is due today. Amount: {amount}. Please follow up.',
            payment.assigned_to_staff_id,
            payment.assigned_staff_email,
            payment.assigned_staff_name
          );
        }

        notificationsSent++;
      }
      // DUE IN 3 DAYS
      else if (daysUntilDue === 3) {
        console.log(`   ⏰ Due in 3 days (reminder)`);
        
        // Notify client
        await notifyClient(
          payment,
          'Reminder',
          '⏰ PAYMENT REMINDER: Your {payment_phase} for service request #{request_number} is due in 3 days on {due_date}. Amount: {amount}. Please prepare payment.'
        );

        // Notify all admins
        const adminsQuery = `
          SELECT user_id, email, first_name, last_name 
          FROM users 
          WHERE user_type = 'admin' AND status = 'Active'
        `;
        const adminsResult = await pool.query(adminsQuery);

        for (const admin of adminsResult.rows) {
          await notifyStaff(
            payment,
            'Reminder',
            '⏰ PAYMENT REMINDER: {payment_phase} for request #{request_number} from {customer_name} is due in 3 days on {due_date}. Amount: {amount}.',
            admin.user_id,
            admin.email,
            `${admin.first_name} ${admin.last_name}`
          );
        }

        // Notify assigned staff if exists
        if (payment.assigned_to_staff_id && payment.assigned_staff_email) {
          await notifyStaff(
            payment,
            'Reminder',
            '⏰ PAYMENT REMINDER: {payment_phase} for your assigned request #{request_number} from {customer_name} is due in 3 days on {due_date}. Amount: {amount}.',
            payment.assigned_to_staff_id,
            payment.assigned_staff_email,
            payment.assigned_staff_name
          );
        }

        notificationsSent++;
      }
      else {
        console.log(`   ✓ No action needed`);
      }
    }

    console.log(`\n✅ Payment notification check complete`);
    console.log(`📤 Notifications sent: ${notificationsSent}`);
    console.log(`📊 Tracking ${sentNotifications.size} notifications today\n`);

  } catch (error) {
    console.error('❌ Error checking payment due dates:', error);
  }
};

// Function to notify when payment deadline is first set (Bug #3 & #7)
const notifyPaymentDeadlineSet = async (requestId, paymentPhase, dueDate, amount) => {
  try {
    console.log(`\n🔔 Notifying about new payment deadline for request #${requestId}`);
    
    // Get request and customer details
    const requestQuery = `
      SELECT 
        sr.request_id,
        sr.request_number,
        sr.requested_by_user_id as customer_id,
        sr.assigned_to_staff_id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.email as customer_email,
        CONCAT(staff.first_name, ' ', staff.last_name) as assigned_staff_name,
        staff.email as assigned_staff_email
      FROM service_requests sr
      JOIN users u ON sr.requested_by_user_id = u.user_id
      LEFT JOIN users staff ON sr.assigned_to_staff_id = staff.user_id
      WHERE sr.request_id = $1
    `;
    
    const result = await pool.query(requestQuery, [requestId]);
    
    if (result.rows.length === 0) {
      console.error(`❌ Request #${requestId} not found`);
      return;
    }
    
    const request = result.rows[0];
    const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedAmount = `₱${parseFloat(amount).toLocaleString()}`;
    
    // Notify client
    await createNotification(
      request.customer_id,
      'Payment',
      `Payment Deadline Set - ${request.request_number}`,
      `📅 Payment deadline has been set for your ${paymentPhase} on service request #${request.request_number}. Amount: ${formattedAmount}. Due date: ${formattedDueDate}. Please mark your calendar.`,
      request.customer_email
    );
    
    console.log(`✅ Client notified about payment deadline`);
    
    // Notify all admins
    const adminsQuery = `
      SELECT user_id, email, first_name, last_name 
      FROM users 
      WHERE user_type = 'admin' AND status = 'Active'
    `;
    const adminsResult = await pool.query(adminsQuery);
    
    for (const admin of adminsResult.rows) {
      await createNotification(
        admin.user_id,
        'Payment',
        `Payment Deadline Set - ${request.request_number}`,
        `📅 Payment deadline set: ${paymentPhase} for request #${request.request_number} from ${request.customer_name}. Amount: ${formattedAmount}. Due: ${formattedDueDate}.`,
        admin.email
      );
    }
    
    console.log(`✅ Admin(s) notified about payment deadline`);
    
    // Notify assigned staff if exists
    if (request.assigned_to_staff_id && request.assigned_staff_email) {
      await createNotification(
        request.assigned_to_staff_id,
        'Payment',
        `Payment Deadline Set - ${request.request_number}`,
        `📅 Payment deadline set: ${paymentPhase} for your assigned request #${request.request_number} from ${request.customer_name}. Amount: ${formattedAmount}. Due: ${formattedDueDate}.`,
        request.assigned_staff_email
      );
      
      console.log(`✅ Assigned staff notified about payment deadline`);
    }
    
  } catch (error) {
    console.error('❌ Error notifying about payment deadline:', error);
  }
};

// Schedule payment notifications to run daily at 8:00 AM
const schedulePaymentNotifications = () => {
  console.log('🚀 Initializing payment notification scheduler...');
  
  // Run daily at 8:00 AM (Philippine Time)
  // Cron format: second minute hour day month weekday
  cron.schedule('0 8 * * *', async () => {
    console.log('\n⏰ Daily payment notification check triggered');
    await checkPaymentDueDates();
    cleanupTrackingData();
  }, {
    timezone: 'Asia/Manila'
  });
  
  console.log('✅ Payment notification scheduler active (runs daily at 8:00 AM PHT)');
  
  // OPTIONAL: Run immediately on startup for testing
  // Uncomment the line below if you want to test immediately
  // setTimeout(checkPaymentDueDates, 5000);
};

module.exports = {
  schedulePaymentNotifications,
  checkPaymentDueDates,
  notifyPaymentDeadlineSet
};