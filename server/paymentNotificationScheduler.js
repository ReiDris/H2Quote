const cron = require("node-cron");
const pool = require("./config/database");
const { createNotification } = require("./controllers/notificationController");

const sentNotifications = new Map();

const cleanupTrackingData = () => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const [key, timestamp] of sentNotifications.entries()) {
    if (timestamp < sevenDaysAgo) {
      sentNotifications.delete(key);
    }
  }
};

const getNotificationKey = (paymentId, notificationType, recipientId, date) => {
  return `${paymentId}-${notificationType}-${recipientId}-${date}`;
};

const wasNotificationSent = (paymentId, notificationType, recipientId) => {
  const today = new Date().toISOString().split("T")[0];
  const key = getNotificationKey(
    paymentId,
    notificationType,
    recipientId,
    today
  );
  return sentNotifications.has(key);
};

const markNotificationSent = (paymentId, notificationType, recipientId) => {
  const today = new Date().toISOString().split("T")[0];
  const key = getNotificationKey(
    paymentId,
    notificationType,
    recipientId,
    today
  );
  sentNotifications.set(key, Date.now());
};

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

const notifyClient = async (payment, notificationType, messageTemplate) => {
  if (
    wasNotificationSent(
      payment.payment_id,
      notificationType,
      payment.customer_id
    )
  ) {
    return;
  }

  const message = messageTemplate
    .replace("{payment_phase}", payment.payment_phase)
    .replace("{request_number}", payment.request_number)
    .replace("{amount}", `₱${parseFloat(payment.amount).toLocaleString()}`)
    .replace(
      "{due_date}",
      new Date(payment.due_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

  try {
    await createNotification(
      payment.customer_id,
      "Payment",
      `Payment ${notificationType} - ${payment.request_number}`,
      message,
      payment.customer_email
    );

    markNotificationSent(
      payment.payment_id,
      notificationType,
      payment.customer_id
    );
  } catch (error) {
    console.error(`Failed to notify client:`, error);
  }
};

const notifyStaff = async (
  payment,
  notificationType,
  messageTemplate,
  recipientId,
  recipientEmail,
  recipientName
) => {
  if (wasNotificationSent(payment.payment_id, notificationType, recipientId)) {
    return;
  }

  const message = messageTemplate
    .replace("{payment_phase}", payment.payment_phase)
    .replace("{request_number}", payment.request_number)
    .replace("{customer_name}", payment.customer_name)
    .replace("{amount}", `₱${parseFloat(payment.amount).toLocaleString()}`)
    .replace(
      "{due_date}",
      new Date(payment.due_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

  try {
    await createNotification(
      recipientId,
      "Payment",
      `Payment ${notificationType} - ${payment.request_number}`,
      message,
      recipientEmail
    );

    markNotificationSent(payment.payment_id, notificationType, recipientId);
  } catch (error) {
    console.error(`Failed to notify staff:`, error);
  }
};

const checkPaymentDueDates = async () => {
  try {
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
        AND sr.payment_deadline IS NOT NULL
        AND p.due_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY p.due_date ASC
    `;

    const result = await pool.query(paymentsQuery);
    const payments = result.rows;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const payment of payments) {
      if (!payment.due_date) {
        continue;
      }

      const dueDate = new Date(payment.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (isNaN(dueDate.getTime())) {
        continue;
      }

      const daysUntilDue = Math.floor(
        (dueDate - today) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDue < 0) {
        const lastOverdueSent = await getLastOverdueNotificationDate(
          payment.payment_id
        );

        let shouldSendOverdue = false;

        if (!lastOverdueSent) {
          shouldSendOverdue = true;
        } else {
          const daysSinceLastNotification = Math.floor(
            (today - lastOverdueSent) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastNotification >= 3) {
            shouldSendOverdue = true;
          }
        }

        if (shouldSendOverdue) {
          const daysOverdue = Math.abs(daysUntilDue);
          const reminderText =
            daysOverdue <= 3
              ? ""
              : daysOverdue <= 7
              ? "⚠️ URGENT - "
              : "🚨 CRITICAL - ";

          await notifyClient(
            payment,
            "Overdue",
            `${reminderText}⚠️ OVERDUE PAYMENT (${daysOverdue} day${
              daysOverdue > 1 ? "s" : ""
            }): Your {payment_phase} for service request #{request_number} is past due. Amount: {amount}. Original due date: {due_date}. Please settle immediately.`
          );

          const adminsQuery = `
            SELECT user_id, email, first_name, last_name 
            FROM users 
            WHERE user_type = 'admin' AND status = 'Active'
          `;
          const adminsResult = await pool.query(adminsQuery);

          for (const admin of adminsResult.rows) {
            await notifyStaff(
              payment,
              "Overdue",
              `${reminderText}⚠️ OVERDUE PAYMENT (${daysOverdue} day${
                daysOverdue > 1 ? "s" : ""
              }): {payment_phase} for request #{request_number} from {customer_name}. Amount: {amount}. Please follow up immediately.`,
              admin.user_id,
              admin.email,
              `${admin.first_name} ${admin.last_name}`
            );
          }

          if (payment.assigned_to_staff_id && payment.assigned_staff_email) {
            await notifyStaff(
              payment,
              "Overdue",
              `${reminderText}⚠️ OVERDUE PAYMENT (${daysOverdue} day${
                daysOverdue > 1 ? "s" : ""
              }): {payment_phase} for your assigned request #{request_number} from {customer_name}. Amount: {amount}. Please follow up with the client.`,
              payment.assigned_to_staff_id,
              payment.assigned_staff_email,
              payment.assigned_staff_name
            );
          }
        }
      } else if (daysUntilDue === 0) {
        await notifyClient(
          payment,
          "Due Today",
          "🔔 PAYMENT DUE TODAY: Your {payment_phase} for service request #{request_number} is due today. Amount: {amount}. Please process payment to avoid delays."
        );

        const adminsQuery = `
          SELECT user_id, email, first_name, last_name 
          FROM users 
          WHERE user_type = 'admin' AND status = 'Active'
        `;
        const adminsResult = await pool.query(adminsQuery);

        for (const admin of adminsResult.rows) {
          await notifyStaff(
            payment,
            "Due Today",
            "📋 PAYMENT DUE TODAY: Issue payment request for {payment_phase} on request #{request_number} from {customer_name}. Amount: {amount}.",
            admin.user_id,
            admin.email,
            `${admin.first_name} ${admin.last_name}`
          );
        }

        if (payment.assigned_to_staff_id && payment.assigned_staff_email) {
          await notifyStaff(
            payment,
            "Due Today",
            "📋 PAYMENT DUE TODAY: {payment_phase} for your assigned request #{request_number} from {customer_name} is due today. Amount: {amount}. Please follow up.",
            payment.assigned_to_staff_id,
            payment.assigned_staff_email,
            payment.assigned_staff_name
          );
        }
      } else if (daysUntilDue === 3) {
        await notifyClient(
          payment,
          "Reminder",
          "⏰ PAYMENT REMINDER: Your {payment_phase} for service request #{request_number} is due in 3 days on {due_date}. Amount: {amount}. Please prepare payment."
        );

        const adminsQuery = `
          SELECT user_id, email, first_name, last_name 
          FROM users 
          WHERE user_type = 'admin' AND status = 'Active'
        `;
        const adminsResult = await pool.query(adminsQuery);

        for (const admin of adminsResult.rows) {
          await notifyStaff(
            payment,
            "Reminder",
            "⏰ PAYMENT REMINDER: {payment_phase} for request #{request_number} from {customer_name} is due in 3 days on {due_date}. Amount: {amount}.",
            admin.user_id,
            admin.email,
            `${admin.first_name} ${admin.last_name}`
          );
        }

        if (payment.assigned_to_staff_id && payment.assigned_staff_email) {
          await notifyStaff(
            payment,
            "Reminder",
            "⏰ PAYMENT REMINDER: {payment_phase} for your assigned request #{request_number} from {customer_name} is due in 3 days on {due_date}. Amount: {amount}.",
            payment.assigned_to_staff_id,
            payment.assigned_staff_email,
            payment.assigned_staff_name
          );
        }
      } else if (daysUntilDue === 7) {
        await notifyClient(
          payment,
          "Reminder",
          "📅 PAYMENT REMINDER: Your {payment_phase} for service request #{request_number} is due in 7 days on {due_date}. Amount: {amount}. Please prepare payment."
        );

        const adminsQuery = `
          SELECT user_id, email, first_name, last_name 
          FROM users 
          WHERE user_type = 'admin' AND status = 'Active'
        `;
        const adminsResult = await pool.query(adminsQuery);

        for (const admin of adminsResult.rows) {
          await notifyStaff(
            payment,
            "Reminder",
            "📅 PAYMENT REMINDER: {payment_phase} for request #{request_number} from {customer_name} is due in 7 days on {due_date}. Amount: {amount}.",
            admin.user_id,
            admin.email,
            `${admin.first_name} ${admin.last_name}`
          );
        }

        if (payment.assigned_to_staff_id && payment.assigned_staff_email) {
          await notifyStaff(
            payment,
            "Reminder",
            "📅 PAYMENT REMINDER: {payment_phase} for your assigned request #{request_number} from {customer_name} is due in 7 days on {due_date}. Amount: {amount}.",
            payment.assigned_to_staff_id,
            payment.assigned_staff_email,
            payment.assigned_staff_name
          );
        }
      }
    }
  } catch (error) {
    console.error("Error checking payment due dates:", error);
  }
};

const notifyPaymentDeadlineSet = async (
  requestId,
  paymentPhase,
  dueDate,
  amount
) => {
  try {
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
      return;
    }

    const request = result.rows[0];
    const formattedDueDate = new Date(dueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedAmount = `₱${parseFloat(amount).toLocaleString()}`;

    await createNotification(
      request.customer_id,
      "Payment",
      `Payment Deadline Set - ${request.request_number}`,
      `📅 Payment deadline has been set for your ${paymentPhase} on service request #${request.request_number}. Amount: ${formattedAmount}. Due date: ${formattedDueDate}. Please mark your calendar.`,
      request.customer_email
    );

    const adminsQuery = `
      SELECT user_id, email, first_name, last_name 
      FROM users 
      WHERE user_type = 'admin' AND status = 'Active'
    `;
    const adminsResult = await pool.query(adminsQuery);

    for (const admin of adminsResult.rows) {
      await createNotification(
        admin.user_id,
        "Payment",
        `Payment Deadline Set - ${request.request_number}`,
        `📅 Payment deadline set: ${paymentPhase} for request #${request.request_number} from ${request.customer_name}. Amount: ${formattedAmount}. Due: ${formattedDueDate}.`,
        admin.email
      );
    }

    if (request.assigned_to_staff_id && request.assigned_staff_email) {
      await createNotification(
        request.assigned_to_staff_id,
        "Payment",
        `Payment Deadline Set - ${request.request_number}`,
        `📅 Payment deadline set: ${paymentPhase} for your assigned request #${request.request_number} from ${request.customer_name}. Amount: ${formattedAmount}. Due: ${formattedDueDate}.`,
        request.assigned_staff_email
      );
    }
  } catch (error) {
    console.error("Error notifying about payment deadline:", error);
  }
};

const schedulePaymentNotifications = () => {
  cron.schedule(
    "0 8 * * *",
    async () => {
      await checkPaymentDueDates();
      cleanupTrackingData();
    },
    {
      timezone: "Asia/Manila",
    }
  );
};

module.exports = {
  schedulePaymentNotifications,
  checkPaymentDueDates,
  notifyPaymentDeadlineSet,
};