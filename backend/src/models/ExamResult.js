/**
 * ExamResult Model
 * Stores calculated results for exam attempts
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const ExamResult = sequelize.define('exam_results', {
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
        unique: true, // One result per attempt
    },
    total_score: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
    },
    max_score: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
    },
    percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: { min: 0, max: 100 },
    },
    correct_answers: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    total_questions: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
    },
    is_passed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    calculated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

module.exports = ExamResult;
