/**
 * JWT Utility
 * Token generation and verification
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env.config');

class JWTUtil {
    /**
     * Generate access token
     * @param {Object} payload - Token payload (user data)
     * @returns {string} JWT token
     */
    static generateAccessToken(payload) {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
        });
    }

    /**
     * Generate refresh token
     * @param {Object} payload - Token payload (user data)
     * @returns {string} JWT refresh token
     */
    static generateRefreshToken(payload) {
        return jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshExpiresIn,
        });
    }

    /**
     * Verify access token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     * @throws {Error} If token is invalid or expired
     */
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, config.jwt.secret);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Verify refresh token
     * @param {string} token - JWT refresh token
     * @returns {Object} Decoded token payload
     * @throws {Error} If token is invalid or expired
     */
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, config.jwt.refreshSecret);
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    /**
     * Decode token without verification
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    static decodeToken(token) {
        return jwt.decode(token);
    }
}

module.exports = JWTUtil;
