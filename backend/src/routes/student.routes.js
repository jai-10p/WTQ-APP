/**
 * Student Routes
 * Exam execution endpoints
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
    examIdValidator,
    attemptIdValidator,
    submitAnswerValidator,
} = require('../validators/student.validator');

// All routes require authentication and student role (or admin/super_user for testing)
// Note: In a real app, admins might want to test exams too.
router.use(authenticate);

/**
 * @route   GET /api/v1/student/exams
 * @desc    Get available exams
 */
router.get('/exams', studentController.getAvailableExams);

/**
 * @route   POST /api/v1/student/exams/:id/start
 * @desc    Start an exam attempt
 */
router.post(
    '/exams/:id/start',
    examIdValidator,
    validate,
    studentController.startExam
);

/**
 * @route   GET /api/v1/student/attempts/:attemptId/questions
 * @desc    Get questions for an active attempt
 */
router.get(
    '/attempts/:attemptId/questions',
    attemptIdValidator,
    validate,
    studentController.getAttemptQuestions
);

/**
 * @route   POST /api/v1/student/attempts/:attemptId/answer
 * @desc    Submit an answer
 */
router.post(
    '/attempts/:attemptId/answer',
    attemptIdValidator,
    submitAnswerValidator,
    validate,
    studentController.submitAnswer
);

/**
 * @route   POST /api/v1/student/attempts/:attemptId/submit
 * @desc    Finish and submit exam
 */
router.post(
    '/attempts/:attemptId/submit',
    attemptIdValidator,
    validate,
    studentController.submitExam
);

/**
 * @route   GET /api/v1/student/attempts/:attemptId/result
 * @desc    Get exam result
 */
router.get(
    '/attempts/:attemptId/result',
    attemptIdValidator,
    validate,
    studentController.getExamResult
);

/**
 * @route   GET /api/v1/student/results
 * @desc    Get all exam results for student
 */
router.get('/results', studentController.getMyResults);

module.exports = router;
