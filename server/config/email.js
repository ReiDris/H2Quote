// config/email.js
const nodemailer = require('nodemailer');

// Validate required environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Missing required email environment variables (EMAIL_USER, EMAIL_PASSWORD)');
    process.exit(1);
}

const emailConfig = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
};

const transporter = nodemailer.createTransporter(emailConfig);

// Verify transporter configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter configuration error:', error);
        // Don't exit here - let the app start but log the error
    } else {
        console.log('Email server is ready to send messages');
    }
});

module.exports = transporter;