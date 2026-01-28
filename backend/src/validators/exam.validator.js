/**
 * Exam Validators
 * Request validation for exam endpoints
 */

const { body, param } = require('express-validator');

const createExamValidator = [
    body('exam_title')
        .trim()
        .notEmpty()
        .withMessage('Exam title is required')
        .isLength({ min: 3, max: 255 })
        .withMessage('Exam title must be between 3 and 255 characters'),
    body('description')
        .optional()
        .trim(),
    body('scheduled_start')
        .isISO8601()
        .withMessage('Valid scheduled start date is required'),
    body('scheduled_end')
        .isISO8601()
        .withMessage('Valid scheduled end date is required')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.scheduled_start)) {
                throw new Error('Scheduled end must be after scheduled start');
            }
            return true;
        }),
    body('duration_minutes')
        .isInt({ min: 1, max: 600 })
        .withMessage('Duration must be between 1 and 600 minutes'),
    body('passing_score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Passing score must be between 0 and 100'),
];

const updateExamValidator = [
    body('exam_title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Exam title cannot be empty')
        .isLength({ min: 3, max: 255 })
        .withMessage('Exam title must be between 3 and 255 characters'),
    body('description')
        .optional()
        .trim(),
    body('scheduled_start')
        .optional()
        .isISO8601()
        .withMessage('Valid scheduled start date is required'),
    body('scheduled_end')
        .optional()
        .isISO8601()
        .withMessage('Valid scheduled end date is required'),
    body('duration_minutes')
        .optional()
        .isInt({ min: 1, max: 600 })
        .withMessage('Duration must be between 1 and 600 minutes'),
    body('passing_score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Passing score must be between 0 and 100'),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean'),
];

const assignQuestionsValidator = [
    body('questions')
        .isArray({ min: 1 })
        .withMessage('Questions array is required with at least one question'),
    body('questions.*.question_id')
        .isInt({ min: 1 })
        .withMessage('Valid question ID is required'),
    body('questions.*.question_weightage')
        .isFloat({ min: 0.01 })
        .withMessage('Question weightage must be greater than 0'),
    body('questions.*.question_order')
        .isInt({ min: 1 })
        .withMessage('Question order must be a positive integer'),
];

const examIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid exam ID'),
];

const questionIdValidator = [
    param('questionId')
        .isInt({ min: 1 })
        .withMessage('Invalid question ID'),
];

module.exports = {
    createExamValidator,
    updateExamValidator,
    assignQuestionsValidator,
    examIdValidator,
    questionIdValidator,
};
