const { sequelize } = require('./src/config/database.config');

async function fixConstraints() {
    try {
        console.log('🛠 Starting database constraint repair...');

        // 1. Drop old constraint from exam_questions
        try {
            await sequelize.query('ALTER TABLE exam_questions DROP FOREIGN KEY exam_questions_ibfk_4');
            console.log('✅ Dropped restricted FK from exam_questions');
        } catch (e) {
            console.log('⚠️ Could not drop FK from exam_questions (maybe name differs or already gone)');
        }

        // 2. Add new cascading constraint to exam_questions
        await sequelize.query('ALTER TABLE exam_questions ADD CONSTRAINT exam_questions_ibfk_4 FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE ON UPDATE CASCADE');
        console.log('✅ Added cascading FK to exam_questions');

        // 3. Fix student_answers FK if it is also restricted
        // Let's find the FK name first or just try the standard ones
        try {
            await sequelize.query('ALTER TABLE student_answers DROP FOREIGN KEY student_answers_ibfk_2');
            console.log('✅ Dropped restricted FK from student_answers');
        } catch (e) {
            console.log('⚠️ Could not drop FK from student_answers');
        }

        await sequelize.query('ALTER TABLE student_answers ADD CONSTRAINT student_answers_ibfk_2 FOREIGN KEY (exam_question_id) REFERENCES exam_questions (id) ON DELETE CASCADE ON UPDATE CASCADE');
        console.log('✅ Added cascading FK to student_answers');

        console.log('🎉 Database repair complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing constraints:', error.message);
        process.exit(1);
    }
}

fixConstraints();
