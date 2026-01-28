/**
 * Server Entry Point
 * Initializes database and starts Express server
 */

const app = require('./app');
const config = require('./config/env.config');
const { testConnection } = require('./config/database.config');

// Server instance
let server;

/**
 * Start the server
 */
const startServer = async () => {
    try {
        // Test database connection
        console.log('🔌 Connecting to database...');
        const isConnected = await testConnection();

        if (!isConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Sync database models (create tables if they don't exist)
        if (config.env === 'development') {
            console.log('🔄 Syncing database models...');
            const { sequelize } = require('./config/database.config');
            // Import models to ensure they are registered
            require('./models');

            // NOTE: Using alter: true can cause "Too many keys" error in MySQL 
            // after many restarts. Changed to sync() for stability.
            await sequelize.sync();
            console.log('✅ Database models synced');
        }

        // Start Express server
        server = app.listen(config.port, () => {
            console.log('');
            console.log('='.repeat(50));
            console.log(`🚀 Server running in ${config.env} mode`);
            console.log(`📡 Listening on port ${config.port}`);
            console.log(`🌐 API URL: http://localhost:${config.port}/api/${config.apiVersion}`);
            console.log(`💚 Health Check: http://localhost:${config.port}/api/${config.apiVersion}/health`);
            console.log('='.repeat(50));
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    if (server) {
        server.close(async () => {
            console.log('✅ HTTP server closed');

            // Close database connection
            const { closeConnection } = require('./config/database.config');
            await closeConnection();

            console.log('✅ Graceful shutdown completed');
            process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('❌ Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
