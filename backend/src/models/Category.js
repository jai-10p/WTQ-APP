/**
 * Category Model
 * Represents exam and question categories/subjects
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const Category = sequelize.define('categories', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    category_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [2, 100],
        },
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['category_name'],
        },
    ],
});

module.exports = Category;
