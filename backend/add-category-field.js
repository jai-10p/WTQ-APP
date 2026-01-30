const { sequelize } = require('./src/config/database.config');

async function updateSchema() {
    try {
        console.log('🔄 Adding category column to questions...');
        await sequelize.query(`
            ALTER TABLE questions 
            ADD COLUMN category ENUM('QA', 'DEV', 'UI/UX', 'General') 
            NOT NULL DEFAULT 'General'
        `);
        console.log('✅ category column added.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema update failed:', error.message);
        process.exit(1);
    }
}

updateSchema();
