const { sequelize } = require('../src/config/database.config');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Connected to Aiven database...');

        console.log('Applying schema updates to "questions" table...');

        // Add question_type
        try {
            await sequelize.query("ALTER TABLE questions ADD COLUMN question_type ENUM('mcq', 'sql') NOT NULL DEFAULT 'mcq'");
            console.log('✅ Added question_type to questions');
        } catch (e) {
            console.log('ℹ️ question_type might already exist or error:', e.message);
        }

        // Add reference_solution
        try {
            await sequelize.query("ALTER TABLE questions ADD COLUMN reference_solution TEXT NULL");
            console.log('✅ Added reference_solution to questions');
        } catch (e) {
            console.log('ℹ️ reference_solution might already exist or error:', e.message);
        }

        // Add database_schema
        try {
            await sequelize.query("ALTER TABLE questions ADD COLUMN database_schema TEXT NULL");
            console.log('✅ Added database_schema to questions');
        } catch (e) {
            console.log('ℹ️ database_schema might already exist or error:', e.message);
        }

        console.log('Applying schema updates to "student_answers" table...');

        // Modify selected_option_id to be nullable
        try {
            await sequelize.query("ALTER TABLE student_answers MODIFY COLUMN selected_option_id BIGINT UNSIGNED NULL");
            console.log('✅ Modified selected_option_id in student_answers');
        } catch (e) {
            console.log('ℹ️ selected_option_id modification error:', e.message);
        }

        // Add answer_text
        try {
            await sequelize.query("ALTER TABLE student_answers ADD COLUMN answer_text TEXT NULL");
            console.log('✅ Added answer_text to student_answers');
        } catch (e) {
            console.log('ℹ️ answer_text might already exist or error:', e.message);
        }

        console.log('🚀 All schema updates completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
