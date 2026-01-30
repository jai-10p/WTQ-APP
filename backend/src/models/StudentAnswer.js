/**
 * StudentAnswer Model
 * Stores individual question responses for an attempt
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const StudentAnswer = sequelize.define('student_answers', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    attempt_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: 'exam_attempts',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    exam_question_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: 'exam_questions',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    selected_option_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true, // Null for SQL questions
        references: {
            model: 'mcq_options',
            key: 'id',
        },
    },
    answer_text: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Stores the SQL query, output text, or code written by the student'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stores additional info like selected_language for coding type'
    },
    answered_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
    indexes: [
        {
            fields: ['attempt_id'],
        },
        {
            fields: ['exam_question_id'],
        },
        {
            unique: true,
            fields: ['attempt_id', 'exam_question_id'], // One answer per question per attempt
        },
    ],
});

module.exports = StudentAnswer;
