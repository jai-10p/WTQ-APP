/**
 * Auth Routes
 * Authentication endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadCSV } = require('../middlewares/upload.middleware');


const loginValidator = [
    body('email').notEmpty().withMessage('Username or Email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const registerValidator = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'invigilator', 'student']).withMessage('Invalid role')
];

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get token
 */
router.post('/login', loginValidator, validate, authController.login);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user (Admin only)
 */
router.post(
    '/register',
    authenticate,
    authorize('admin'),
    registerValidator,
    validate,
    authController.register
);

/**
 * @route   POST /api/v1/auth/bulk-register
 * @desc    Bulk register users from CSV/Excel (Admin only)
 */
router.post(
    '/bulk-register',
    authenticate,
    authorize('admin'),
    uploadCSV,
    authController.bulkRegister
);

module.exports = router;

