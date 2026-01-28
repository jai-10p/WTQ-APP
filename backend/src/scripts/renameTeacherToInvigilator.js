
const { sequelize } = require('../config/database.config');

async function runMigration() {
    try {
        console.log('Starting migration: Renaming role teacher to invigilator...');

        // 1. Add 'invigilator' to ENUM
        await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'admin', 'teacher', 'invigilator') NOT NULL DEFAULT 'student'");
        console.log('Added invigilator to ENUM.');

        // 2. Update existing records
        await sequelize.query("UPDATE users SET role = 'invigilator' WHERE role = 'teacher'");
        console.log('Updated teacher records to invigilator.');

        // 3. Remove 'teacher' from ENUM
        await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'admin', 'invigilator') NOT NULL DEFAULT 'student'");
        console.log('Removed teacher from ENUM.');

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
