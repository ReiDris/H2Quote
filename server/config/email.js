const nodemailer = require('nodemailer');

if (!process.env.EMAIL_USER) {
    console.error('Missing required email environment variables (EMAIL_USER)');
    process.exit(1);
}

const sendGridConfig = {
    host: 'smtp.sendgrid.net',
    port: 2525,
    secure: false,
    auth: {
        user: 'apikey', 
        pass: process.env.SENDGRID_API_KEY
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    rateLimit: 5,
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    },
    logger: false,
    debug: false
};

const appPasswordConfig = {
    host: 'smtp.gmail.com',      
    port: 2525,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    rateLimit: 5,
    requireTLS: true,
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    },
    logger: false,
    debug: false
};

const oauth2Config = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    rateLimit: 5,
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    }
};

let emailConfig;
let configType;

if (process.env.SENDGRID_API_KEY) {
    emailConfig = sendGridConfig;
    configType = 'SendGrid';
} else if (process.env.GMAIL_CLIENT_ID && 
           process.env.GMAIL_CLIENT_SECRET && 
           process.env.GMAIL_REFRESH_TOKEN) {
    emailConfig = oauth2Config;
    configType = 'Gmail OAuth2';
} else if (process.env.EMAIL_PASSWORD) {
    emailConfig = appPasswordConfig;
    configType = 'Gmail App Password (Port 2525 STARTTLS)';
} else {
    console.error('Missing email authentication credentials');
    process.exit(1);
}

const transporter = nodemailer.createTransport(emailConfig);

transporter.on('error', (error) => {
    console.error('Transporter error:', error.message);
});

setImmediate(() => {
    const verifyTimeout = setTimeout(() => {}, 10000);

    transporter.verify((error, success) => {
        clearTimeout(verifyTimeout);
        if (error) {
            console.error('Email verification failed:', error.message);
        }
    });
});

const sendEmail = async (to, subject, htmlContent, retries = 2) => {
    const fromEmail = configType === 'SendGrid' 
        ? (process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER)
        : process.env.EMAIL_USER;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); 
            
            try {
                const info = await transporter.sendMail({
                    from: `"TRISHKAYE Enterprises" <${fromEmail}>`,
                    to,
                    subject,
                    html: htmlContent
                });
                
                clearTimeout(timeoutId);
                return true;
                
            } catch (sendError) {
                clearTimeout(timeoutId);
                throw sendError;
            }
            
        } catch (error) {
            if (attempt === retries) {
                console.error('Email sending failed after retries:', error.message);
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return false;
};

const generateUserWelcomeEmail = (customerName, companyName, email, contactNo) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #007bff;">
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Welcome to H2Quote!</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Dear ${customerName},
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Thank you for registering with TRISHKAYE Enterprises. We have received your account registration request and are currently reviewing your information.
                </p>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #dee2e6;">
                    <h3 style="color: #007bff; margin-top: 0;">Registration Details:</h3>
                    <p style="color: #555; margin: 5px 0;"><strong>Company Name:</strong> ${companyName}</p>
                    <p style="color: #555; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="color: #555; margin: 5px 0;"><strong>Contact Number:</strong> ${contactNo}</p>
                </div>
                
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        <strong>What's Next?</strong> Your account is currently under review by our team. You will receive another email once your account has been verified and approved. This process typically takes 1-2 business days.
                    </p>
                </div>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #888; font-size: 14px;">
                        Best regards,<br>
                        TRISHKAYE Enterprises Team
                    </p>
                    <p style="color: #aaa; font-size: 12px; margin-top: 10px;">
                        This is an automated notification from H2Quote
                    </p>
                </div>
            </div>
        </div>
    `;
};

const generateAdminNotificationEmail = (customerName, companyName, email, contactNo) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #28a745;">
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">New User Registration</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    A new user has registered on H2Quote and requires approval.
                </p>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #dee2e6;">
                    <h3 style="color: #28a745; margin-top: 0;">User Details:</h3>
                    <p style="color: #555; margin: 8px 0;"><strong>Name:</strong> ${customerName}</p>
                    <p style="color: #555; margin: 8px 0;"><strong>Company:</strong> ${companyName}</p>
                    <p style="color: #555; margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="color: #555; margin: 8px 0;"><strong>Contact Number:</strong> ${contactNo}</p>
                </div>
                
                <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #0c5460;">
                        <strong>Action Required:</strong> Please review the user's credentials and verification documents, then approve or reject the account.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/verify-accounts" 
                       style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Review Registration
                    </a>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #888; font-size: 14px;">
                        H2Quote Admin Notification System
                    </p>
                </div>
            </div>
        </div>
    `;
};

const generateAccountApprovalEmail = (customerName, companyName, email) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #28a745;">
                <h1 style="color: #155724; text-align: center; margin-bottom: 30px;">Account Approved!</h1>
                
                <p style="font-size: 16px; color: #155724; line-height: 1.6;">
                    Dear ${customerName},
                </p>
                
                <p style="font-size: 16px; color: #155724; line-height: 1.6;">
                    Great news! Your H2Quote account has been successfully verified and approved.
                </p>
                
                <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #155724; margin-top: 0;">Account Details:</h3>
                    <p style="color: #155724; margin: 5px 0;"><strong>Company Name:</strong> ${companyName}</p>
                    <p style="color: #155724; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="color: #155724; margin: 5px 0;"><strong>Status:</strong> Active</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb;">
                    <h3 style="color: #155724; margin-top: 0;">What You Can Do Now:</h3>
                    <ul style="color: #155724; margin: 10px 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">Browse our services catalog and request quotes</li>
                        <li style="margin-bottom: 8px;">Track your service requests and manage payments</li>
                        <li style="margin-bottom: 8px;">Access your account settings and company information</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                       style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Login to Your Account
                    </a>
                </div>
                
                <p style="font-size: 16px; color: #155724; line-height: 1.6;">
                    You can now enjoy full access to our platform and start requesting services for your business needs.
                </p>
                
                <p style="font-size: 16px; color: #155724; line-height: 1.6;">
                    If you have any questions or need assistance getting started, please don't hesitate to contact our support team.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #6c757d; font-size: 14px;">
                        Welcome aboard!<br>
                        The H2Quote Team
                    </p>
                </div>
            </div>
        </div>
    `;
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

const generateAccountRejectionEmail = (userName, companyName, rejectionReason) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #dc3545;">
                <h1 style="color: #721c24; text-align: center; margin-bottom: 30px;">Account Registration Status</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Dear ${userName},
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Thank you for your interest in creating an account with TRISHKAYE Enterprises.
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    Unfortunately, we are unable to approve your registration at this time.
                </p>
                
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #856404; margin-top: 0;">Reason for Rejection:</h3>
                    <p style="color: #856404; line-height: 1.6; margin: 0;">
                        ${rejectionReason}
                    </p>
                </div>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #f5c6cb;">
                    <h3 style="color: #721c24; margin-top: 0;">What You Can Do:</h3>
                    <ul style="color: #555; margin: 10px 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">Review the rejection reason above</li>
                        <li style="margin-bottom: 8px;">If you believe this was an error, contact our support team</li>
                        <li style="margin-bottom: 8px;">You may submit a new registration with the correct information</li>
                    </ul>
                </div>
                
                <p style="font-size: 14px; color: #666; line-height: 1.6;">
                    <strong>Company Information:</strong><br>
                    Company: ${companyName}
                </p>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #888; font-size: 14px;">
                        Best regards,<br>
                        TRISHKAYE Enterprises Team
                    </p>
                    <p style="color: #aaa; font-size: 12px; margin-top: 10px;">
                        This is an automated notification from H2Quote
                    </p>
                </div>
            </div>
        </div>
    `;
};

const sendUserWelcomeEmail = async (customerName, companyName, email, contactNo) => {
    const subject = 'Welcome to H2Quote - Account Under Review';
    const htmlContent = generateUserWelcomeEmail(customerName, companyName, email, contactNo);
    return await sendEmail(email, subject, htmlContent);
};

const sendAdminNotificationEmail = async (customerName, companyName, email, contactNo) => {
    const subject = `New User Registration - ${companyName}`;
    const htmlContent = generateAdminNotificationEmail(customerName, companyName, email, contactNo);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@trishkaye.com';
    return await sendEmail(adminEmail, subject, htmlContent);
};

const sendAccountApprovalEmail = async (customerName, companyName, email) => {
    const subject = 'Account Approved - Welcome to H2Quote!';
    const htmlContent = generateAccountApprovalEmail(customerName, companyName, email);
    return await sendEmail(email, subject, htmlContent);
};

const sendPasswordResetEmail = async (email, userName, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const subject = 'Reset Your H2Quote Password';
    const htmlContent = generatePasswordResetEmail(userName, resetToken, resetUrl);
    return await sendEmail(email, subject, htmlContent);
};

const sendAccountRejectionEmail = async (userName, userEmail, companyName, rejectionReason) => {
    const subject = '[H2Quote] Account Registration Status';
    const htmlContent = generateAccountRejectionEmail(userName, companyName, rejectionReason);
    return await sendEmail(userEmail, subject, htmlContent);
};

module.exports = {
    sendEmail,
    generateUserWelcomeEmail,
    generateAdminNotificationEmail,
    generateAccountApprovalEmail,
    generateAccountRejectionEmail,
    sendUserWelcomeEmail,
    sendAdminNotificationEmail,
    sendAccountApprovalEmail,
    sendAccountRejectionEmail,
    generatePasswordResetEmail,
    sendPasswordResetEmail
};