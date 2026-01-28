/**
 * Student Validators
 * Request validation for student exam endpoints
 */

const { body, param } = require('express-validator');

const examIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid exam ID'),
];

const attemptIdValidator = [
    param('attemptId')
        .isInt({ min: 1 })
        .withMessage('Invalid attempt ID'),
];

const submitAnswerValidator = [
    body('exam_question_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid exam question ID'),
    body('question_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Invalid question ID')
        .custom((value, { req }) => {
            if (!value && !req.body.exam_question_id) {
                throw new Error('Either question_id or exam_question_id is required');
            }
            return true;
        }),
    body('selected_option_id')
        .isInt({ min: 1 })
        .withMessage('Invalid option ID'),
];

module.exports = {
    examIdValidator,
    attemptIdValidator,
    submitAnswerValidator,
};
