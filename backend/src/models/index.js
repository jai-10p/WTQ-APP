/**
 * Models Index
 * Initializes all models and sets up associations
 */

const { sequelize } = require('../config/database.config');

// Import models
const Exam = require('./Exam');
const Question = require('./Question');
const MCQOption = require('./MCQOption');
const ExamQuestion = require('./ExamQuestion');
const User = require('./User'); // Assuming User model exists or will be created
const ExamAttempt = require('./ExamAttempt');
const StudentAnswer = require('./StudentAnswer');
const ExamResult = require('./ExamResult');

// ============================================================
// ASSOCIATIONS
// ============================================================

// Associations Removed: Category

// Exam Associations
// Category association removed


Exam.belongsToMany(Question, {
    through: ExamQuestion,
    foreignKey: 'exam_id',
    otherKey: 'question_id',
    as: 'questions',
});
Exam.hasMany(ExamAttempt, { foreignKey: 'exam_id', as: 'attempts', onDelete: 'CASCADE' });
Exam.hasMany(ExamQuestion, { foreignKey: 'exam_id', as: 'exam_question_links' }); // Direct access for logic

// Question Associations
// Category association removed


Question.hasMany(MCQOption, {
    foreignKey: 'question_id',
    as: 'options',
    onDelete: 'CASCADE',
});

Question.belongsToMany(Exam, {
    through: ExamQuestion,
    foreignKey: 'question_id',
    otherKey: 'exam_id',
    as: 'exams',
});

// MCQOption Associations
MCQOption.belongsTo(Question, {
    foreignKey: 'question_id',
    as: 'question',
});

// ExamQuestion Associations
ExamQuestion.belongsTo(Exam, {
    foreignKey: 'exam_id',
    as: 'exam',
});

ExamQuestion.belongsTo(Question, {
    foreignKey: 'question_id',
    as: 'question',
    onDelete: 'CASCADE',
});

// ExamAttempt Associations
ExamAttempt.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });
ExamAttempt.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
ExamAttempt.hasMany(StudentAnswer, { foreignKey: 'attempt_id', as: 'answers' });
ExamAttempt.hasOne(ExamResult, { foreignKey: 'attempt_id', as: 'result' });

// StudentAnswer Associations
StudentAnswer.belongsTo(ExamAttempt, { foreignKey: 'attempt_id', as: 'attempt' });
StudentAnswer.belongsTo(ExamQuestion, { foreignKey: 'exam_question_id', as: 'exam_question' });
StudentAnswer.belongsTo(MCQOption, { foreignKey: 'selected_option_id', as: 'selected_option' });

// ExamResult Associations
ExamResult.belongsTo(ExamAttempt, { foreignKey: 'attempt_id', as: 'attempt' });

// User Associations (assuming User exists)
if (User) {
    User.hasMany(ExamAttempt, { foreignKey: 'student_id', as: 'exam_attempts', onDelete: 'CASCADE' });
    User.hasMany(Exam, { foreignKey: 'created_by', as: 'created_exams' });
}

// Export models
module.exports = {
    sequelize,
    Exam,
    Question,
    MCQOption,
    ExamQuestion,
    User,
    ExamAttempt,
    StudentAnswer,
    ExamResult,
};
