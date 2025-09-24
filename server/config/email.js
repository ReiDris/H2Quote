const nodemailer = require('nodemailer');

if (!process.env.EMAIL_USER) {
    console.error('Missing required email environment variables (EMAIL_USER)');
    process.exit(1);
}

// Option 1: App Password Configuration (for development)
const appPasswordConfig = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use App Password here
    }
};

// Option 2: OAuth2 Configuration (for production)
const oauth2Config = {
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: process.env.GMAIL_ACCESS_TOKEN
    }
};

// Use OAuth2 if all OAuth credentials are provided, otherwise use App Password
const useOAuth2 = process.env.GMAIL_CLIENT_ID && 
                  process.env.GMAIL_CLIENT_SECRET && 
                  process.env.GMAIL_REFRESH_TOKEN;

const emailConfig = useOAuth2 ? oauth2Config : appPasswordConfig;

if (!useOAuth2 && !process.env.EMAIL_PASSWORD) {
    console.error('Missing EMAIL_PASSWORD for App Password authentication');
    console.log('Please either:');
    console.log('1. Set EMAIL_PASSWORD with Gmail App Password, or');
    console.log('2. Set up OAuth2 with GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN');
    process.exit(1);
}

const transporter = nodemailer.createTransport(emailConfig);

transporter.verify((error, success) => {
    if (error) {
        console.error('Email transporter configuration error:', error);
        console.log('\n=== EMAIL SETUP TROUBLESHOOTING ===');
        console.log('If you\'re seeing authentication errors:');
        console.log('1. Enable 2-Factor Authentication on your Gmail account');
        console.log('2. Generate an App Password at https://myaccount.google.com/apppasswords');
        console.log('3. Use the App Password (not your regular password) in EMAIL_PASSWORD');
        console.log('4. Or set up OAuth2 for production use');
        console.log('=====================================\n');
    } else {
        console.log('Email server is ready to send messages');
        console.log(`Using ${useOAuth2 ? 'OAuth2' : 'App Password'} authentication`);
    }
});

module.exports = transporter;