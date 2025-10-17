const nodemailer = require('nodemailer');

// Validate required environment variables
if (!process.env.EMAIL_USER) {
    console.error('Missing required email environment variables (EMAIL_USER)');
    process.exit(1);
}

// App Password Configuration - Using SSL (Port 465) for better reliability
const appPasswordConfig = {
    host: 'smtp.gmail.com',      // ✅ Explicit host instead of 'service'
    port: 465,                    // ✅ SSL port (more reliable than 587)
    secure: true,                 // ✅ Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    // ✅ Timeout settings
    connectionTimeout: 15000,     // 15 seconds
    greetingTimeout: 15000,
    socketTimeout: 15000,
    // ✅ Connection pooling
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    rateLimit: 5,                 // max 5 emails per second
    // ✅ TLS settings
    tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    },
    logger: false,                // Set to true for debugging
    debug: false                  // Set to true for debugging
};

// OAuth2 Configuration (preferred)
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

// Determine which config to use
const useOAuth2 = process.env.GMAIL_CLIENT_ID && 
                  process.env.GMAIL_CLIENT_SECRET && 
                  process.env.GMAIL_REFRESH_TOKEN;

const emailConfig = useOAuth2 ? oauth2Config : appPasswordConfig;

// Validate configuration
if (!useOAuth2 && !process.env.EMAIL_PASSWORD) {
    console.error('Missing EMAIL_PASSWORD for App Password authentication');
    console.log('Please either:');
    console.log('1. Set EMAIL_PASSWORD with Gmail App Password, or');
    console.log('2. Set up OAuth2 with GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN');
    process.exit(1);
}

console.log('📧 Email Configuration:');
console.log('   Email User:', process.env.EMAIL_USER);
console.log('   Using:', useOAuth2 ? 'OAuth2' : 'App Password (Port 465 SSL)');
console.log('   Admin Email:', process.env.ADMIN_EMAIL || 'Not set');

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// ✅ Graceful error handling
transporter.on('error', (error) => {
    console.error('❌ Transporter error:', error.message);
});

// Verify transporter connection (non-blocking)
setImmediate(() => {
    const verifyTimeout = setTimeout(() => {
        console.log('⚠️  Email verification taking too long, skipping...');
        console.log('   Email service may still work when actually sending messages.\n');
    }, 10000); // 10 second timeout for verification

    transporter.verify((error, success) => {
        clearTimeout(verifyTimeout);
        if (error) {
            console.log('⚠️  Email verification warning:', error.message);
            console.log('   Email service may still work when actually sending messages.');
            console.log('   If emails continue to fail, check:');
            console.log('   1. EMAIL_PASSWORD is a valid Gmail App Password (16 chars, no spaces)');
            console.log('   2. Your Gmail account allows App Passwords (2FA must be enabled)');
            console.log('   3. Visit https://accounts.google.com/DisplayUnlockCaptcha\n');
        } else {
            console.log('✅ Email server verified successfully');
            console.log(`   Ready to send emails via ${useOAuth2 ? 'OAuth2' : 'Gmail App Password'}\n`);
        }
    });
});

// ✅ Improved send email function with retry logic
const sendEmail = async (to, subject, htmlContent, retries = 2) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`📤 Attempting to send email to: ${to} (Attempt ${attempt}/${retries})`);
            
            const sendPromise = transporter.sendMail({
                from: `"TRISHKAYE Enterprises" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlContent
            });

            // 20 second timeout for sending
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Email send timeout after 20 seconds')), 20000)
            );

            const info = await Promise.race([sendPromise, timeoutPromise]);
            
            console.log('✅ Email sent successfully!');
            console.log('   To:', to);
            console.log('   Subject:', subject);
            console.log('   Message ID:', info.messageId);
            return true;
            
        } catch (error) {
            console.error(`❌ Email sending failed (Attempt ${attempt}/${retries})`);
            console.error('   To:', to);
            console.error('   Error:', error.message);
            
            // If this was the last attempt, return false
            if (attempt === retries) {
                console.error('   All retry attempts exhausted');
                return false;
            }
            
            // Wait 2 seconds before retry
            console.log('   Retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    return false;
};

// Email template generators
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
                        TRISHKAYE Enterprises
                    </p>
                </div>
            </div>
        </div>
    `;
};

const generateAdminNotificationEmail = (customerName, companyName, email, contactNo) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fff3cd; padding: 30px; border-radius: 10px; border-left: 5px solid #ffc107;">
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">New User Registration</h1>
                
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    A new user has registered and requires admin approval.
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">User Details:</h3>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
                    <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Contact:</strong> ${contactNo}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/verify-accounts" 
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

const generateAccountApprovalEmail = (customerName, companyName, email) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #d4edda; padding: 30px; border-radius: 10px; border-left: 5px solid #28a745;">
                <h1 style="color: #155724; text-align: center; margin-bottom: 30px;">Account Approved!</h1>
                
                <p style="font-size: 16px; color: #155724; line-height: 1.6;">
                    Dear ${customerName},
                </p>
                
                <p style="font-size: 16px; color: #155724; line-height: 1.6;">
                    Great news! Your H2Quote account for <strong>${companyName}</strong> has been approved and is now active.
                </p>
                
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #c3e6cb;">
                    <h3 style="color: #155724; margin-top: 0;">What's Next?</h3>
                    <ul style="color: #155724; margin: 10px 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;">Log in to your account using your registered email: <strong>${email}</strong></li>
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

// Public API functions
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

// Export all functions
module.exports = {
    sendEmail,
    generateUserWelcomeEmail,
    generateAdminNotificationEmail,
    generateAccountApprovalEmail,
    sendUserWelcomeEmail,
    sendAdminNotificationEmail,
    sendAccountApprovalEmail,
    generatePasswordResetEmail,
    sendPasswordResetEmail
};