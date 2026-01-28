/**
 * Database Seed Script
 * Seeds initial data for testing
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database.config');

// Import models
const { User } = require('../models');

/**
 * Main seed function
 */
const seed = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Sync database (create tables if they don't exist)
        // Using force: true to wipe the old schema on Aiven that still has categories
        await sequelize.sync({ force: true });
        console.log('✅ Database synced');

        console.log('✅ Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run seed if called directly
if (require.main === module) {
    seed();
}

module.exports = { seed };
