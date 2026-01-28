/**
 * MCQOption Model
 * Represents multiple choice options for questions
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const MCQOption = sequelize.define('mcq_options', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
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
    option_text: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    is_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    display_order: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
    },
}, {
    timestamps: false,
    indexes: [
        {
            fields: ['question_id'],
        },
    ],
});

module.exports = MCQOption;
