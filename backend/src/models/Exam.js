/**
 * Exam Model
 * Represents exams with scheduling and configuration
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Exam = sequelize.define('exams', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    exam_title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 255],
        },
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    scheduled_start: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
        },
    },
    scheduled_end: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfterStart(value) {
                if (value <= this.scheduled_start) {
                    throw new Error('scheduled_end must be after scheduled_start');
                }
            },
        },
    },
    duration_minutes: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
            min: 1,
            max: 600, // 10 hours max
        },
    },
    passing_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 50.00,
        validate: {
            min: 0,
            max: 100,
        },
        comment: 'Passing percentage (0-100)',
    },
    created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    allowed_designations: {
        type: DataTypes.TEXT, // Store as JSON string or comma-separated values
        allowNull: true,
        comment: 'JSON array of designations allowed to take this exam',
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['scheduled_start', 'scheduled_end'],
        },
        {
            fields: ['created_by'],
        },
        {
            fields: ['is_active'],
        },
    ],
});

module.exports = Exam;
