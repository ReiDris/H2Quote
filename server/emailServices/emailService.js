const transporter = require('../config/email');

const sendEmail = async (to, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: 'TRISHKAYE Enterprises <noreply@trishkaye.com>',
            to,
            subject,
            html: htmlContent
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

const generateUserWelcomeEmail = (customerName, companyName, email, contactNo) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to H2Quote!</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Dear ${customerName},
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Thank you for registering with H2Quote! Your account for <strong>${companyName}</strong> has been submitted and is currently under review.
                </p>
                
                <div style="background-color: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Account Details:</h3>
                    <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Contact:</strong> ${contactNo}</p>
                </div>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Our admin team will review your application and verification documents. You'll receive an email notification once your account is approved.
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    If you have any questions, please don't hesitate to contact our support team.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #888; font-size: 14px;">
                        Best regards,<br>
                        The H2Quote Team
                    </p>
                </div>
            </div>
        </div>
    `;
};

const generateAdminNotificationEmail = (userId, customerName, companyName, email, contactNo) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; padding: 30px; border-radius: 10px; border-left: 5px solid #ffc107;">
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">New User Registration</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    A new user has registered and requires admin approval.
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">User Details:</h3>
                    <p style="margin: 5px 0;"><strong>User ID:</strong> ${userId}</p>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
                    <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Contact:</strong> ${contactNo}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.ADMIN_URL || 'http://localhost:3000'}/admin/pending-users" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Review Application
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
                    Please review the user's verification documents and approve or reject their application.
                </p>
            </div>
        </div>
    `;
};

const sendUserWelcomeEmail = async (customerName, companyName, email, contactNo) => {
    const subject = 'Welcome to H2Quote - Account Under Review';
    const htmlContent = generateUserWelcomeEmail(customerName, companyName, email, contactNo);
    return await sendEmail(email, subject, htmlContent);
};

const sendAdminNotificationEmail = async (userId, customerName, companyName, email, contactNo) => {
    const subject = `New User Registration - ${companyName}`;
    const htmlContent = generateAdminNotificationEmail(userId, customerName, companyName, email, contactNo);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@trishkaye.com';
    return await sendEmail(adminEmail, subject, htmlContent);
};

const generatePasswordResetEmail = (userName, resetToken, resetUrl) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #007bff;">
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Password Reset Request</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Hello ${userName},
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    We received a request to reset your password for your H2Quote account. If you didn't make this request, you can safely ignore this email.
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    To reset your password, click the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Reset Your Password
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; line-height: 1.6;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
                </p>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you don't reset your password within this time, you'll need to request a new reset link.
                    </p>
                </div>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    If you have any questions or need assistance, please contact our support team.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #888; font-size: 14px;">
                        Best regards,<br>
                        The H2Quote Team
                    </p>
                </div>
            </div>
        </div>
    `;
};

const sendPasswordResetEmail = async (email, userName, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const subject = 'Reset Your H2Quote Password';
    const htmlContent = generatePasswordResetEmail(userName, resetToken, resetUrl);
    return await sendEmail(email, subject, htmlContent);
};

module.exports = {
    sendEmail,
    generateUserWelcomeEmail,
    generateAdminNotificationEmail,
    sendUserWelcomeEmail,
    sendAdminNotificationEmail,
    generatePasswordResetEmail,
    sendPasswordResetEmail
};