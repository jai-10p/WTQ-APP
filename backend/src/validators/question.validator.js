/**
 * Question Validators
 * Request validation for question endpoints
 */

const { body, param } = require('express-validator');

const createQuestionValidator = [
    body('category_id')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Valid category ID'),
    body('question_text')
        .trim()
        .notEmpty()
        .withMessage('Question text is required'),
    body('question_type')
        .optional()
        .isIn(['mcq', 'sql'])
        .withMessage('Question type must be mcq or sql'),
    body('image_url')
        .optional()
        .trim()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    body('weightage')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Weightage must be greater than 0'),
    body('reference_solution')
        .if(body('question_type').equals('sql'))
        .trim()
        .notEmpty()
        .withMessage('Reference solution is required for SQL questions'),
    body('database_schema')
        .optional()
        .trim(),
    body('options')
        .if(body('question_type').not().equals('sql'))
        .isArray({ min: 2 })
        .withMessage('At least 2 options are required for MCQ questions'),
    body('options.*.option_text')
        .if(body('question_type').not().equals('sql'))
        .trim()
        .notEmpty()
        .withMessage('Option text is required'),
    body('options.*.is_correct')
        .if(body('question_type').not().equals('sql'))
        .isBoolean()
        .withMessage('is_correct must be a boolean'),
    body('options.*.display_order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Display order must be a positive integer'),
];

const updateQuestionValidator = [
    body('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid category ID is required'),
    body('question_text')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Question text cannot be empty'),
    body('question_type')
        .optional()
        .isIn(['mcq', 'sql'])
        .withMessage('Question type must be mcq or sql'),
    body('image_url')
        .optional()
        .trim()
        .custom((value) => {
            if (value === null || value === '') return true;
            try {
                new URL(value);
                return true;
            } catch {
                throw new Error('Image URL must be a valid URL');
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
