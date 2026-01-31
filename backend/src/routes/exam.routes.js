/**
 * Exam Routes
 * Routes for exam management
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { authenticate, authorize, optionalAuthenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
    createExamValidator,
    updateExamValidator,
    assignQuestionsValidator,
    examIdValidator,
    questionIdValidator,
} = require('../validators/exam.validator');

/**
 * @route   POST /api/v1/exams
 * @desc    Create new exam
 * @access  Admin, Super User, Invigilator
 */
router.post(
    '/',
    authenticate,
    authorize('invigilator'),
    createExamValidator,
    validate,
    examController.createExam
);

/**
 * @route   GET /api/v1/exams
 * @desc    Get all exams (with filters)
 * @access  Public
 */
router.get('/', optionalAuthenticate, examController.getAllExams);

/**
 * @route   GET /api/v1/exams/:id
 * @desc    Get exam by ID
 * @access  Public
 */
router.get(
    '/:id',
    examIdValidator,
    validate,
    examController.getExamById
);

/**
 * @route   PUT /api/v1/exams/:id
 * @desc    Update exam
 * @access  Admin, Super User, Invigilator
 */
router.put(
    '/:id',
    authenticate,
    authorize('invigilator'),
    examIdValidator,
    updateExamValidator,
    validate,
    examController.updateExam
);

/**
 * @route   DELETE /api/v1/exams/:id
 * @desc    Delete exam (soft delete)
 * @access  Super User
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'invigilator'),
    examIdValidator,
    validate,
    examController.deleteExam
);

/**
 * @route   POST /api/v1/exams/:id/questions
 * @desc    Assign questions to exam
 * @access  Admin, Super User, Invigilator
 */
router.post(
    '/:id/questions',
    authenticate,
    authorize('invigilator'),
    examIdValidator,
    assignQuestionsValidator,
    validate,
    examController.assignQuestions
);

/**
 * @route   GET /api/v1/exams/:id/questions
 * @desc    Get exam questions
 * @access  Public
 */
router.get(
    '/:id/questions',
    examIdValidator,
    validate,
    examController.getExamQuestions
);

/**
 * @route   DELETE /api/v1/exams/:id/questions/:questionId
 * @desc    Remove question from exam
 * @access  Admin, Super User, Invigilator
 */
router.delete(
    '/:id/questions/:questionId',
    authenticate,
    authorize('invigilator'),
    examIdValidator,
    questionIdValidator,
    validate,
    examController.removeQuestion
);

/**
 * @route   GET /api/v1/exams/:id/attempts
 * @desc    Get exam attempts (results)
 * @access  Admin, Invigilator
 */
router.get(
    '/:id/attempts',
    authenticate,
    authorize('admin', 'invigilator'),
    examIdValidator,
    validate,
    examController.getExamAttempts
);

/**
 * @route   POST /api/v1/exams/attempts/:attemptId/allow-resume
 * @desc    Allow disqualified student to resume exam
 * @access  Admin, Invigilator
 */
router.post(
    '/attempts/:attemptId/allow-resume',
    authenticate,
    authorize('admin', 'invigilator'),
    examController.allowResume
);


module.exports = router;
