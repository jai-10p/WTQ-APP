const { sequelize } = require('./src/config/database.config');

async function migrateProduction() {
    try {
        console.log('🚀 Starting PRODUCTION database migration...');

        // 1. Update Questions table schema
        console.log('📋 Updating Questions table...');
        try {
            await sequelize.query(`
                ALTER TABLE questions 
                MODIFY COLUMN question_type ENUM('mcq', 'sql', 'output', 'statement', 'coding') 
                NOT NULL DEFAULT 'mcq'
            `);
            console.log('✅ question_type ENUM updated.');
        } catch (e) {
            console.error('❌ Failed to update ENUM:', e.message);
        }

        try {
            await sequelize.query('ALTER TABLE questions ADD COLUMN reference_solution TEXT NULL AFTER question_type');
            console.log('✅ reference_solution column added.');
        } catch (e) {
            console.log('ℹ️ reference_solution might already exist.');
        }

        try {
            await sequelize.query('ALTER TABLE questions ADD COLUMN database_schema TEXT NULL AFTER reference_solution');
            console.log('✅ database_schema column added.');
        } catch (e) {
            console.log('ℹ️ database_schema might already exist.');
        }

        // 2. Update StudentAnswers table
        console.log('📋 Updating Student Answers table...');
        try {
            await sequelize.query('ALTER TABLE student_answers ADD COLUMN metadata JSON NULL AFTER answer_text');
            console.log('✅ metadata column added.');
        } catch (e) {
            console.log('ℹ️ metadata column might already exist.');
        }

        // 3. Fix Constraints (Cascading Deletion)
        console.log('🔗 Updating Foreign Key constraints...');

        // Fix exam_questions -> questions link
        try {
            await sequelize.query('ALTER TABLE exam_questions DROP FOREIGN KEY exam_questions_ibfk_4');
            console.log('✅ Dropped old FK from exam_questions');
        } catch (e) {
            console.log('⚠️ Could not drop FK from exam_questions (might have different name)');
        }

        try {
            await sequelize.query('ALTER TABLE exam_questions ADD CONSTRAINT exam_questions_ibfk_4 FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE ON UPDATE CASCADE');
            console.log('✅ Added cascading FK to exam_questions');
        } catch (e) {
            console.error('❌ Failed to add FK to exam_questions:', e.message);
        }

        // Fix student_answers -> exam_questions link
        try {
            await sequelize.query('ALTER TABLE student_answers DROP FOREIGN KEY student_answers_ibfk_2');
            console.log('✅ Dropped old FK from student_answers');
        } catch (e) {
            console.log('⚠️ Could not drop FK from student_answers');
        }

        try {
            await sequelize.query('ALTER TABLE student_answers ADD CONSTRAINT student_answers_ibfk_2 FOREIGN KEY (exam_question_id) REFERENCES exam_questions (id) ON DELETE CASCADE ON UPDATE CASCADE');
            console.log('✅ Added cascading FK to student_answers');
        } catch (e) {
            console.error('❌ Failed to add FK to student_answers:', e.message);
        }

        console.log('\n🎉 PRODUCTION MIGRATION COMPLETE!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrateProduction();
