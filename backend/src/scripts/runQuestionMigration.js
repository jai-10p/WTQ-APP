/**
 * Migration Script
 * Runs the SQL migration to make category_id nullable in questions table
 */

const { sequelize } = require('../config/database.config');

async function runMigration() {
    try {
        console.log('🔄 Starting database migration for questions table...');

        console.log('⚙️ Executing SQL: ALTER TABLE questions MODIFY COLUMN category_id INT UNSIGNED NULL;');
        await sequelize.query('ALTER TABLE questions MODIFY COLUMN category_id INT UNSIGNED NULL;');

        console.log('✅ Migration successful: category_id is now nullable in questions table.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
