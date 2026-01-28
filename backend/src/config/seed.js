/**
 * Database Seed Script
 * Seeds initial data for testing
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database.config');

// Import models (will be created after User model is implemented)
const { Category } = require('../models');

/**
 * Seed categories
 */
const seedCategories = async () => {
    const categories = [
        {
            category_name: 'Data Structures',
            description: 'Arrays, Linked Lists, Trees, Graphs, Hash Tables',
        },
        {
            category_name: 'Algorithms',
            description: 'Sorting, Searching, Dynamic Programming, Greedy Algorithms',
        },
        {
            category_name: 'Database',
            description: 'SQL, NoSQL, Database Design, Normalization',
        },
        {
            category_name: 'Web Development',
            description: 'HTML, CSS, JavaScript, React, Node.js',
        },
        {
            category_name: 'Operating Systems',
            description: 'Process Management, Memory Management, File Systems',
        },
    ];

    for (const category of categories) {
        await Category.findOrCreate({
            where: { category_name: category.category_name },
            defaults: category,
        });
    }

    console.log('✅ Categories seeded');
};

/**
 * Main seed function
 */
const seed = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Sync database (create tables if they don't exist)
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced');

        // Seed data
        await seedCategories();

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

module.exports = { seed, seedCategories };
