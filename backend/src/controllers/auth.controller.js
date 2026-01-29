/**
 * Auth Controller
 * Handles user authentication/login
 */

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const JWTUtil = require('../utils/jwt.util');
const ApiResponse = require('../utils/apiResponse');

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email: identifier, password } = req.body; // Accept email field as identifier

        if (!identifier) {
            return ApiResponse.error(res, 'Username or Email is required', 400);
        }

        // 1. Find user by email OR username
        const { Op } = require('sequelize');
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            return ApiResponse.unauthorized(res, 'Invalid credentials');
        }

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return ApiResponse.unauthorized(res, 'Invalid credentials');
        }

        // 3. Check if active
        if (!user.is_active) {
            return ApiResponse.forbidden(res, 'Account is disabled');
        }

        // 4. Generate Tokens
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            designation: user.designation
        };

        const accessToken = JWTUtil.generateAccessToken(payload);
        const refreshToken = JWTUtil.generateRefreshToken(payload);

        return ApiResponse.success(res, {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                designation: user.designation
            },
            token: accessToken,
            refreshToken
        }, 'Login successful');

    } catch (error) {
        next(error);
    }
};

/**
 * Register new user (Admin only)
 * @route POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { username, email, password, role, designation } = req.body;

        // 1. Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return ApiResponse.error(res, 'User with this email already exists', 400);
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Create user
        const newUser = await User.create({
            username,
            email,
            password_hash,
            role: role || 'student',
            designation: designation || null,
            is_active: true
        });

        const userResponse = {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            email: newUser.email,
            role: newUser.role,
            designation: newUser.designation,
            is_active: newUser.is_active,
            created_at: newUser.created_at
        };

        return ApiResponse.created(res, userResponse, 'User created successfully');

    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    register
};
