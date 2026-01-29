const { Question, MCQOption } = require('../src/models');
const { sequelize } = require('../src/config/database.config');

const questionsData = [
    {
        text: 'What is the primary goal of regression testing?',
        difficulty: 'medium',
        options: [
            { text: 'To find new bugs', isCorrect: false },
            { text: 'To ensure new changes haven’t broken existing functionality', isCorrect: true },
            { text: 'To test the performance of the application', isCorrect: false },
            { text: 'To test the user interface', isCorrect: false }
        ]
    },
    {
        text: 'Which tool is used for performance testing?',
        difficulty: 'easy',
        options: [
            { text: 'Selenium', isCorrect: false },
            { text: 'JMeter', isCorrect: true },
            { text: 'JIRA', isCorrect: false },
            { text: 'Git', isCorrect: false }
        ]
    },
    {
        text: 'What is the purpose of a test case?',
        difficulty: 'medium',
        options: [
            { text: 'To document the steps for debugging', isCorrect: false },
            { text: 'To define the expected results for a specific set of inputs', isCorrect: true },
            { text: 'To track defects', isCorrect: false },
            { text: 'To automate testing', isCorrect: false }
        ]
    },
    {
        text: 'Which testing level focuses on individual components or modules?',
        difficulty: 'easy',
        options: [
            { text: 'System Testing', isCorrect: false },
            { text: 'Integration Testing', isCorrect: false },
            { text: 'Unit Testing', isCorrect: true },
            { text: 'Acceptance Testing', isCorrect: false }
        ]
    },
    {
        text: 'What is the main purpose of a bug tracking system?',
        difficulty: 'easy',
        options: [
            { text: 'To automate test execution', isCorrect: false },
            { text: 'To document and track defects', isCorrect: true },
            { text: 'To generate test reports', isCorrect: false },
            { text: 'To manage test cases', isCorrect: false }
        ]
    },
    {
        text: 'Which of the following is a black-box testing technique?',
        difficulty: 'medium',
        options: [
            { text: 'Code review', isCorrect: false },
            { text: 'Boundary value analysis', isCorrect: true },
            { text: 'Unit testing', isCorrect: false },
            { text: 'Static analysis', isCorrect: false }
        ]
    },
    {
        text: 'What is the purpose of a test plan?',
        difficulty: 'medium',
        options: [
            { text: 'To execute test cases', isCorrect: false },
            { text: 'To define the scope, approach, and schedule of testing activities', isCorrect: true },
            { text: 'To log defects', isCorrect: false },
            { text: 'To automate test scripts', isCorrect: false }
        ]
    },
    {
        text: 'Which of the following is NOT a testing principle?',
        difficulty: 'hard',
        options: [
            { text: 'Exhaustive testing is possible', isCorrect: true },
            { text: 'Defects cluster together', isCorrect: false },
            { text: 'Testing shows the presence of defects', isCorrect: false },
            { text: 'Early testing is beneficial', isCorrect: false }
        ]
    },
    {
        text: 'What is the purpose of a traceability matrix?',
        difficulty: 'medium',
        options: [
            { text: 'To track test execution', isCorrect: false },
            { text: 'To map requirements to test cases', isCorrect: true },
            { text: 'To log defects', isCorrect: false },
            { text: 'To automate test scripts', isCorrect: false }
        ]
    },
    {
        text: 'Which of the following is a functional testing type?',
        difficulty: 'easy',
        options: [
            { text: 'Load testing', isCorrect: false },
            { text: 'Stress testing', isCorrect: false },
            { text: 'Usability testing', isCorrect: false },
            { text: 'Regression testing', isCorrect: true }
        ]
    },
    {
        text: 'What is the main purpose of exploratory testing?',
        difficulty: 'medium',
        options: [
            { text: 'To execute predefined test cases', isCorrect: false },
            { text: 'To explore the application and find defects without predefined scripts', isCorrect: true },
            { text: 'To automate test scripts', isCorrect: false },
            { text: 'To test the performance of the application', isCorrect: false }
        ]
    },
    {
        text: 'Which of the following is a static testing technique?',
        difficulty: 'medium',
        options: [
            { text: 'Unit testing', isCorrect: false },
            { text: 'Code review', isCorrect: true },
            { text: 'Integration testing', isCorrect: false },
            { text: 'System testing', isCorrect: false }
        ]
    }
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to Aiven...');

        // Find an admin user to be the creator
        const { User } = require('../src/models');
        const admin = await User.findOne({ where: { role: ['admin', 'invigilator'] } });

        if (!admin) {
            console.error('No Admin or Invigilator found in users table. Please create one first.');
            process.exit(1);
        }

        for (const q of questionsData) {
            // Check if question already exists to avoid duplicates
            const [question, created] = await Question.findOrCreate({
                where: { question_text: q.text },
                defaults: {
                    difficulty: q.difficulty,
                    created_by: admin.id,
                    weightage: 1.0,
                    is_active: true
                }
            });

            if (created || (await MCQOption.count({ where: { question_id: question.id } })) === 0) {
                console.log(`Seeding options for: ${q.text.substring(0, 30)}...`);
                // Clear existing options if any (incase question existed but options didn't)
                await MCQOption.destroy({ where: { question_id: question.id } });

                for (let i = 0; i < q.options.length; i++) {
                    const opt = q.options[i];
                    await MCQOption.create({
                        question_id: question.id,
                        option_text: opt.text,
                        is_correct: opt.isCorrect,
                        display_order: i + 1
                    });
                }
            } else {
                console.log(`Skipping (already exists): ${q.text.substring(0, 30)}...`);
            }
        }

        console.log('✅ All questions and options seeded successfully to Aiven!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding questions:', error);
        process.exit(1);
    }
}

seed();
