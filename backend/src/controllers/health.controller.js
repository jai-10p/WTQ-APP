/**
 * Health Check Controller
 * Provides system health and status endpoints
 */

const ApiResponse = require('../utils/apiResponse');
const { sequelize } = require('../config/database.config');
const config = require('../config/env.config');

/**
 * Basic health check
 * @route GET /api/v1/health
 */
const healthCheck = async (req, res) => {
    try {
        return ApiResponse.success(res, {
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: config.env,
        }, 'Server is running');
    } catch (error) {
        return ApiResponse.error(res, 'Health check failed', 500);
    }
};

/**
 * Database health check
 * @route GET /api/v1/health/db
 */
const databaseHealthCheck = async (req, res) => {
    try {
        // Test database connection
        await sequelize.authenticate();

        return ApiResponse.success(res, {
            database: 'connected',
            dialect: config.database.dialect,
            host: config.database.host,
            name: config.database.name,
        }, 'Database connection is healthy');
    } catch (error) {
        return ApiResponse.error(
            res,
            'Database connection failed',
            503,
            error.message
        );
    }
};

/**
 * Detailed system status
 * @route GET /api/v1/health/status
 */
const systemStatus = async (req, res) => {
    try {
        const dbStatus = await sequelize.authenticate()
            .then(() => 'connected')
            .catch(() => 'disconnected');

        return ApiResponse.success(res, {
            server: {
                status: 'running',
                environment: config.env,
                nodeVersion: process.version,
                platform: process.platform,
                uptime: process.uptime(),
                memory: {
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                },
            },
            database: {
                status: dbStatus,
                dialect: config.database.dialect,
                host: config.database.host,
            },
            timestamp: new Date().toISOString(),
        }, 'System status retrieved successfully');
    } catch (error) {
        return ApiResponse.error(res, 'Failed to retrieve system status', 500);
    }
};

module.exports = {
    healthCheck,
    databaseHealthCheck,
    systemStatus,
};
