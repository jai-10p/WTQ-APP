/**
 * Category Validators
 * Request validation for category endpoints
 */

const { body, param } = require('express-validator');

const createCategoryValidator = [
    body('category_name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
];

const updateCategoryValidator = [
    body('category_name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category name cannot be empty')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
];

const categoryIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid category ID'),
];

module.exports = {
    createCategoryValidator,
    updateCategoryValidator,
    categoryIdValidator,
};
