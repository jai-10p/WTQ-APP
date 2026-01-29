/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

const ApiResponse = require('../utils/apiResponse');
const config = require('../config/env.config');

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // Log error in development
    if (config.env === 'development') {
        console.error('Error:', err);
    }

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        console.error('Sequelize Validation Error Details:', JSON.stringify(err.errors, null, 2));
        statusCode = 422;
        message = 'Validation Error';
        const errors = err.errors.map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return ApiResponse.validationError(res, errors);
    }

    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'Duplicate entry';
        const errors = err.errors.map((e) => ({
            field: e.path,
            message: `${e.path} already exists`,
        }));
        return ApiResponse.error(res, message, statusCode, errors);
    }

    // Sequelize database errors
    if (err.name === 'SequelizeDatabaseError') {
        statusCode = 500;
        message = 'Database error occurred';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    // Send error response
    return ApiResponse.error(
        res,
        message,
        statusCode,
        config.env === 'development' ? err.stack : null
    );
};

/**
 * 404 Not Found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
    return ApiResponse.notFound(
        res,
        `Route ${req.originalUrl} not found`
    );
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
