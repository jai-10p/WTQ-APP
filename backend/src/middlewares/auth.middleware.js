/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const JWTUtil = require('../utils/jwt.util');
const ApiResponse = require('../utils/apiResponse');

/**
 * Authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.unauthorized(res, 'No token provided');
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = JWTUtil.verifyAccessToken(token);

        // Attach user data to request
        req.user = decoded;

        next();
    } catch (error) {
        return ApiResponse.unauthorized(res, error.message);
    }
};

/**
 * Authorize user roles
 * @param {...string} allowedRoles - Allowed role names
 * @returns {Function} Middleware function
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return ApiResponse.unauthorized(res, 'User not authenticated');
        }

        // Check if user has any of the allowed roles
        const userRole = req.user.role;
        const hasPermission = allowedRoles.includes(userRole);

        if (!hasPermission) {
            return ApiResponse.forbidden(
                res,
                'You do not have permission to access this resource'
            );
        }

        next();
    };
};

/**
 * Optional authentication
 * Attaches user to request if token is valid, but doesn't error if not
 */
const optionalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = JWTUtil.verifyAccessToken(token);
            req.user = decoded;
        }
        next();
    } catch (error) {
        // Continue even if token is invalid
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    optionalAuthenticate,
};
