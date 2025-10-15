// Import sendEmail function from config/email.js (not transporter!)
const { sendEmail: sendEmailFromConfig } = require('../config/email');

// Use the imported sendEmail function instead of transporter
const sendEmail = async (to, subject, htmlContent) => {
    return await sendEmailFromConfig(to, subject, htmlContent);
};

// Generic notification email template
const generateNotificationEmail = (userName, subject, messageBody, actionUrl = null) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">H2Quote Notification</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Hello ${userName},
                </p>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <h3 style="color: #333; margin-top: 0;">${subject}</h3>
                    <p style="color: #555; line-height: 1.6; margin: 0;">
                        ${messageBody}
                    </p>
                </div>
                
                ${actionUrl ? `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${actionUrl}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        View Details
                    </a>
                </div>
                ` : ''}
                
                <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 20px;">
                    You are receiving this email because you have an active account with H2Quote.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #888; font-size: 14px;">
                        Best regards,<br>
                        TRISHKAYE Enterprises
                    </p>
                </div>
            </div>
        </div>
    `;
};

// Service Request specific email template
const generateServiceRequestEmail = (userName, requestNumber, status, message, requestId) => {
    const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/service-requests/${requestId}`;
    
    let statusColor = '#007bff';
    if (status === 'Completed') statusColor = '#28a745';
    else if (status === 'Rejected' || status === 'Cancelled') statusColor = '#dc3545';
    else if (status === 'In Progress' || status === 'Ongoing') statusColor = '#ffc107';
    
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Service Request Update</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Hello ${userName},
                </p>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                    <h3 style="color: #333; margin-top: 0;">Request #${requestNumber}</h3>
                    <p style="margin: 10px 0;">
                        <strong>Status:</strong> 
                        <span style="color: ${statusColor}; font-weight: bold;">${status}</span>
                    </p>
                    <p style="color: #555; line-height: 1.6; margin: 15px 0 0 0;">
                        ${message}
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${actionUrl}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        View Request Details
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; line-height: 1.6;">
                    If you have any questions about this update, please don't hesitate to contact our support team.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #888; font-size: 14px;">
                        Best regards,<br>
                        TRISHKAYE Enterprises
                    </p>
                </div>
            </div>
        </div>
    `;
};

// Send notification email
const sendNotificationEmail = async (email, userName, subject, messageBody, actionUrl = null) => {
    const htmlContent = generateNotificationEmail(userName, subject, messageBody, actionUrl);
    return await sendEmail(email, subject, htmlContent);
};

// Send service request notification email
const sendServiceRequestNotificationEmail = async (email, userName, requestNumber, status, message, requestId) => {
    const subject = `Service Request Update - ${requestNumber}`;
    const htmlContent = generateServiceRequestEmail(userName, requestNumber, status, message, requestId);
    return await sendEmail(email, subject, htmlContent);
};

// Re-export common functions from config/email.js
const {
    generateUserWelcomeEmail,
    generateAdminNotificationEmail,
    generateAccountApprovalEmail,
    sendUserWelcomeEmail,
    sendAdminNotificationEmail,
    sendAccountApprovalEmail,
    generatePasswordResetEmail,
    sendPasswordResetEmail
} = require('../config/email');

module.exports = {
    sendEmail,
    generateUserWelcomeEmail,
    generateAdminNotificationEmail,
    generateAccountApprovalEmail,
    sendUserWelcomeEmail,
    sendAdminNotificationEmail,
    sendAccountApprovalEmail,
    generatePasswordResetEmail,
    sendPasswordResetEmail,
    sendNotificationEmail,
    sendServiceRequestNotificationEmail
};