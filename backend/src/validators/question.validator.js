/**
 * Question Validators
 * Request validation for question endpoints
 */

const { body, param } = require('express-validator');

// Helper to validate URL or relative path
const isValidUrlOrPath = (url) => {
    // Accept relative paths starting with /
    if (typeof url === 'string' && url.startsWith('/')) return true;
    // Accept full URLs
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const createQuestionValidator = [
    body('category')
        .notEmpty()
        .isIn(['QA', 'DEV', 'UI/UX', 'General'])
        .withMessage('Valid category is required (QA, DEV, UI/UX, or General)'),
    body('question_text')
        .trim()
        .notEmpty()
        .withMessage('Question text is required'),
    body('question_type')
        .optional()
        .isIn(['mcq', 'sql', 'output', 'statement', 'coding'])
        .withMessage('Question type must be mcq, sql, output, statement, or coding'),
    body('image_url')
        .optional()
        .trim()
        .custom((value) => {
            if (value === null || value === '' || value === undefined) return true;
            try {
                // Check if it's a JSON array of URLs or paths
                if (value.startsWith('[')) {
                    const urls = JSON.parse(value);
                    if (!Array.isArray(urls)) throw new Error('Must be an array');
                    if (!urls.every(url => isValidUrlOrPath(url))) throw new Error('Invalid URL/path');
                    return true;
                }
                // Single URL or path
                return isValidUrlOrPath(value);
            } catch {
                throw new Error('Image URL must be a valid URL, path, or JSON array');
            }
        }),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    body('weightage')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Weightage must be greater than 0'),
    body('reference_solution')
        .if(body('question_type').isIn(['sql', 'output', 'coding']))
        .trim()
        .notEmpty()
        .withMessage('Reference solution is required for this question type'),
    body('database_schema')
        .optional()
        .trim(),
    body('options')
        .if(body('question_type').isIn(['mcq', 'statement']))
        .isArray({ min: 2 })
        .withMessage('At least 2 options are required for this question type'),
    body('options.*.option_text')
        .if(body('question_type').isIn(['mcq', 'statement']))
        .trim()
        .notEmpty()
        .withMessage('Option text is required'),
    body('options.*.is_correct')
        .if(body('question_type').isIn(['mcq', 'statement']))
        .isBoolean()
        .withMessage('is_correct must be a boolean'),
    body('options.*.display_order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Display order must be a positive integer'),
];

const updateQuestionValidator = [
    body('category')
        .optional()
        .isIn(['QA', 'DEV', 'UI/UX', 'General'])
        .withMessage('Category must be QA, DEV, UI/UX, or General'),
    body('question_text')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Question text cannot be empty'),
    body('question_type')
        .optional()
        .isIn(['mcq', 'sql', 'output', 'statement', 'coding'])
        .withMessage('Question type must be mcq, sql, output, statement, or coding'),
    body('image_url')
        .optional()
        .trim()
        .custom((value) => {
            if (value === null || value === '' || value === undefined) return true;
            try {
                // Check if it's a JSON array of URLs or paths
                if (value.startsWith('[')) {
                    const urls = JSON.parse(value);
                    if (!Array.isArray(urls)) throw new Error('Must be an array');
                    if (!urls.every(url => isValidUrlOrPath(url))) throw new Error('Invalid URL/path');
                    return true;
                }
                // Single URL or path
                return isValidUrlOrPath(value);
            } catch {
                throw new Error('Image URL must be a valid URL, path, or JSON array');
            }
        }),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    body('weightage')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Weightage must be greater than 0'),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean'),
    body('reference_solution')
        .optional()
        .trim(),
    body('database_schema')
        .optional()
        .trim(),
];

const optionValidator = [
    body('option_text')
        .trim()
        .notEmpty()
        .withMessage('Option text is required'),
    body('is_correct')
        .optional()
        .isBoolean()
        .withMessage('is_correct must be a boolean'),
    body('display_order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Display order must be a positive integer'),
];

const questionIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid question ID'),
];

const optionIdValidator = [
    param('optionId')
        .isInt({ min: 1 })
        .withMessage('Invalid option ID'),
];

module.exports = {
    createQuestionValidator,
    updateQuestionValidator,
    optionValidator,
    questionIdValidator,
    optionIdValidator,
};
