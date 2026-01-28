/**
 * Question Model
 * Represents exam questions with difficulty and weightage
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Question = sequelize.define('questions', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    category_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true, // Categories are being removed
        references: {
            model: 'categories',
            key: 'id',
        },
    },
    question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Optional image path or URL',
    },
    difficulty: {
        type: DataTypes.ENUM('easy', 'medium', 'hard'),
        allowNull: false,
        defaultValue: 'medium',
    },
    weightage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 1.00,
        validate: {
            min: 0.01,
        },
        comment: 'Default points for this question',
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
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['category_id'],
        },
        {
            fields: ['difficulty'],
        },
        {
            fields: ['created_by'],
        },
        {
            fields: ['is_active'],
        },
    ],
});

module.exports = Question;
