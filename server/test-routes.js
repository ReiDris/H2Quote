require('dotenv').config(); // Add this line
const express = require('express');

// Test each route file individually
const testRouteFile = (filename) => {
    try {
        console.log(`Testing ${filename}...`);
        const router = require(`./routes/${filename}`);
        const app = express();
        app.use('/test', router);
        console.log(`✓ ${filename} is valid`);
        return true;
    } catch (error) {
        console.error(`✗ ${filename} failed:`, error.message);
        return false;
    }
};

// Test each route file
const routes = ['health', 'auth', 'admin', 'messaging', 'serviceRequests', 'chatbot'];
routes.forEach(testRouteFile);