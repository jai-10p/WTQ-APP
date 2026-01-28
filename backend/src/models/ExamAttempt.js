/**
 * ExamAttempt Model
 * Tracks student's exam sessions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const ExamAttempt = sequelize.define('exam_attempts', {
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
            onDelete: 'CASCADE',
        },
    },
    student_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
            onDelete: 'CASCADE',
        },
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('in_progress', 'submitted', 'abandoned', 'timeout'),
        allowNull: false,
        defaultValue: 'in_progress',
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    user_agent: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
}, {
    timestamps: false,
    indexes: [
        {
            fields: ['exam_id'],
        },
        {
            fields: ['student_id'],
        },
        {
            fields: ['status'],
        },
    ],
});

module.exports = ExamAttempt;
