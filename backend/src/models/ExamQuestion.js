/**
 * ExamQuestion Model
 * Junction table linking exams to questions with custom weightage
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const ExamQuestion = sequelize.define('exam_questions', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    exam_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: 'exams',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    question_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: 'questions',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    question_order: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
    },
    question_weightage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0.01,
        },
        comment: 'Weightage for this question in this exam',
    },
}, {
    timestamps: false,
    indexes: [
        {
            fields: ['exam_id'],
        },
        {
            fields: ['question_id'],
        },
        {
            unique: true,
            fields: ['exam_id', 'question_id'],
            name: 'unique_exam_question',
        },
    ],
});

module.exports = ExamQuestion;
