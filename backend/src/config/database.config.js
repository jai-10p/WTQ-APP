/**
 * Database Configuration and Connection
 * Using Sequelize ORM with MySQL2
 */

const { Sequelize } = require('sequelize');
const config = require('./env.config');

// Initialize Sequelize instance
const sequelize = new Sequelize(
    config.database.name,
    config.database.username,
    config.database.password,
    {
        host: config.database.host,
        port: config.database.port,
        dialect: config.database.dialect,
        pool: config.database.pool,
        logging: config.database.logging,
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true,
        },
    }
);

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
        return false;
    }
};

/**
 * Sync database models
 * @param {Object} options - Sequelize sync options
 * @returns {Promise<void>}
 */
const syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('❌ Database synchronization failed:', error.message);
        throw error;
    }
};

/**
 * Close database connection
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
    try {
        await sequelize.close();
        console.log('✅ Database connection closed.');
    } catch (error) {
        console.error('❌ Error closing database connection:', error.message);
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    closeConnection,
};
