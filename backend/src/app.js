/**
 * Express Application Setup
 * Configures middleware and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env.config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Initialize Express app
const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers
app.use(cors(config.cors)); // CORS configuration

// ============================================================
// BODY PARSING MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// ============================================================
// REQUEST LOGGING (Development only)
// ============================================================
if (config.env === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ============================================================
// API ROUTES
// ============================================================
app.use(`/api/${config.apiVersion}`, routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Exam Portal Backend API',
        version: '1.0.0',
        documentation: `/api/${config.apiVersion}`,
        timestamp: new Date().toISOString(),
    });
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // Global error handler

module.exports = app;
