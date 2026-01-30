const { sequelize } = require('./src/config/database.config');

async function updateSchema() {
    try {
        console.log('🔄 Starting schema update...');

        // Update question_type ENUM in questions table
        await sequelize.query(`
            ALTER TABLE questions 
            MODIFY COLUMN question_type ENUM('mcq', 'sql', 'output', 'statement', 'coding') 
            NOT NULL DEFAULT 'mcq'
        `);
        console.log('✅ question_type ENUM updated.');

        // Add metadata column to student_answers
        // Using a try-catch for individual column adds is safer in case it already exists
        try {
            await sequelize.query(`
                ALTER TABLE student_answers 
                ADD COLUMN metadata JSON NULL AFTER answer_text
            `);
            console.log('✅ metadata column added to student_answers.');
        } catch (e) {
            console.log('ℹ️ metadata column might already exist, skipping...');
        }

        console.log('✅ Schema update completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema update failed:', error.message);
        process.exit(1);
    }
}

updateSchema();
