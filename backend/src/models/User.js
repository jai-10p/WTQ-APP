/**
 * User Model
 * Represents system users (students, admins, etc.)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

const User = sequelize.define('users', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 100],
        },
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('student', 'admin', 'invigilator'),
        allowNull: false,
        defaultValue: 'student',
    },
    designation: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null, // e.g., 'QA', 'DEV', 'UI/UX'
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
});

const bcrypt = require('bcryptjs');

// Instance method to compare password
User.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password_hash);
};

module.exports = User;
