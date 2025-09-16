const nodemailer = require('nodemailer');

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

// Change from createTransporter to createTransport
const transporter = nodemailer.createTransport(emailConfig);

transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

module.exports = transporter;