const cron = require('node-cron');
const pool = require('./config/database');
const { createNotification } = require('./controllers/notificationController');

const schedulePaymentReminders = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const query = `
        SELECT 
          p.payment_id,
          p.payment_phase,
          p.amount,
          p.due_date,
          p.status,
          sr.request_number,
          sr.requested_by_user_id,
          sr.status_name,
          u.email,
          u.first_name,
          EXTRACT(DAY FROM (p.due_date - CURRENT_DATE)) as days_until_due
        FROM payments p
        JOIN service_requests sr ON p.request_id = sr.request_id
        JOIN request_status rs ON sr.status_id = rs.status_id
        JOIN users u ON sr.requested_by_user_id = u.user_id
        WHERE p.status IN ('Pending', 'Overdue')
          AND p.due_date IS NOT NULL
          AND (
            (p.payment_phase IN ('Full Payment', 'Down Payment')
              AND (
                p.due_date = CURRENT_DATE + INTERVAL '7 days'
                OR p.due_date = CURRENT_DATE + INTERVAL '1 day'
                OR (p.due_date < CURRENT_DATE AND p.status != 'Overdue')
              )
            )
            OR
            (p.payment_phase = 'Completion Balance'
              AND rs.status_name = 'Completed'
              AND (
                p.due_date = CURRENT_DATE + INTERVAL '7 days'
                OR p.due_date = CURRENT_DATE + INTERVAL '1 day'
                OR (p.due_date < CURRENT_DATE AND p.status != 'Overdue')
              )
            )
          )
      `;
      
      const result = await pool.query(query);
      
      for (const payment of result.rows) {
        const daysUntilDue = parseInt(payment.days_until_due);
        let subject, messageBody;
        
        if (daysUntilDue === 7) {
          subject = `Payment Reminder - Due in 7 Days`;
          messageBody = `Your ${payment.payment_phase} payment of ₱${parseFloat(payment.amount).toLocaleString()} for service request #${payment.request_number} is due in 7 days (${new Date(payment.due_date).toLocaleDateString()}). Please ensure timely payment.`;
        } else if (daysUntilDue === 1) {
          subject = `Payment Reminder - Due Tomorrow`;
          messageBody = `Your ${payment.payment_phase} payment of ₱${parseFloat(payment.amount).toLocaleString()} for service request #${payment.request_number} is due tomorrow (${new Date(payment.due_date).toLocaleDateString()}). Please make your payment as soon as possible.`;
        } else if (daysUntilDue < 0) {
          subject = `Payment Overdue`;
          messageBody = `Your ${payment.payment_phase} payment of ₱${parseFloat(payment.amount).toLocaleString()} for service request #${payment.request_number} is now overdue. Due date was ${new Date(payment.due_date).toLocaleDateString()}. Please submit payment immediately to avoid service delays.`;
          
          await pool.query(
            'UPDATE payments SET status = $1 WHERE payment_id = $2',
            ['Overdue', payment.payment_id]
          );
        }
        
        await createNotification(
          payment.requested_by_user_id,
          'Payment',
          subject,
          messageBody,
          payment.email  
        );
      }
      
    } catch (error) {
      console.error('Error in payment reminder scheduler:', error);
    }
  });
};

module.exports = { schedulePaymentReminders };