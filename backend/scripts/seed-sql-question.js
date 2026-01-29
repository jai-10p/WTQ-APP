const { Question } = require('../src/models');
const { sequelize } = require('../src/config/database.config');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to Aiven...');

        // Find an admin user
        const { User } = require('../src/models');
        const admin = await User.findOne({ where: { role: 'admin' } });

        if (!admin) {
            console.error('No admin found');
            process.exit(1);
        }

        const sqlQuestion = await Question.create({
            question_text: 'Query all columns for all American cities in the CITY table with populations larger than 100,000. The CountryCode for America is USA.',
            difficulty: 'easy',
            created_by: admin.id,
            weightage: 5.0,
            question_type: 'sql',
            database_schema: `
                CREATE TABLE IF NOT EXISTS CITY (
                    ID INT PRIMARY KEY,
                    NAME VARCHAR(17),
                    COUNTRYCODE VARCHAR(3),
                    DISTRICT VARCHAR(20),
                    POPULATION INT
                );
                DELETE FROM CITY;
                INSERT INTO CITY VALUES (6, 'Rotterdam', 'NLD', 'Zuid-Holland', 593321);
                INSERT INTO CITY VALUES (3878, 'Scottsdale', 'USA', 'Arizona', 202705);
                INSERT INTO CITY VALUES (3965, 'Corona', 'USA', 'California', 124966);
                INSERT INTO CITY VALUES (4054, 'Fairfield', 'USA', 'California', 92256);
            `,
            reference_solution: "SELECT * FROM CITY WHERE COUNTRYCODE = 'USA' AND POPULATION > 100000;"
        });

        console.log('✅ Sample SQL question created!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

seed();
