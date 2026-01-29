/**
 * Question Routes
 * Routes for question management
 */

const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { uploadImage, uploadCSV } = require('../middlewares/upload.middleware');
const {
    createQuestionValidator,
    updateQuestionValidator,
    optionValidator,
    questionIdValidator,
    optionIdValidator,
} = require('../validators/question.validator');

/**
 * @route   POST /api/v1/questions/upload-image
 * @desc    Upload question image
 * @access  Admin, Super User, Invigilator
 */
router.post(
    '/upload-image',
    authenticate,
    authorize('invigilator'),
    uploadImage,
    questionController.uploadQuestionImage
);

/**
 * @route   POST /api/v1/questions/bulk-upload
 * @desc    Bulk upload questions via CSV
 * @access  Admin, Super User, Invigilator
 */
router.post(
    '/bulk-upload',
    authenticate,
    authorize('invigilator'),
    uploadCSV,
    questionController.bulkUploadQuestions
);

/**
 * @route   GET /api/v1/questions/csv-template
 * @desc    Download CSV template
 * @access  Public
 */
router.get(
    '/csv-template',
    questionController.downloadCSVTemplate
);

router.post(
    '/run-sql',
    authenticate,
    questionController.runSQL
);

/**
 * @route   POST /api/v1/questions
 * @desc    Create new question with MCQ options
 * @access  Admin, Super User, Invigilator
 */
router.post(
    '/',
    authenticate,
    authorize('invigilator'),
    createQuestionValidator,
    validate,
    questionController.createQuestion
);

/**
 * @route   GET /api/v1/questions
 * @desc    Get all questions (with filters)
 * @access  Public
 */
router.get('/', questionController.getAllQuestions);

/**
 * @route   GET /api/v1/questions/:id
 * @desc    Get question by ID
 * @access  Public
 */
router.get(
    '/:id',
    questionIdValidator,
    validate,
    questionController.getQuestionById
);

/**
 * @route   PUT /api/v1/questions/:id
 * @desc    Update question
 * @access  Admin, Super User, Invigilator
 */
router.put(
    '/:id',
    authenticate,
    authorize('invigilator'),
    questionIdValidator,
    updateQuestionValidator,
    validate,
    questionController.updateQuestion
);

/**
 * @route   DELETE /api/v1/questions/:id
 * @desc    Delete question (soft delete)
 * @access  Super User
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin', 'invigilator'),
    questionIdValidator,
    validate,
    questionController.deleteQuestion
);

/**
 * @route   POST /api/v1/questions/:id/options
 * @desc    Add MCQ option to question
 * @access  Admin, Super User, Invigilator
 */
router.post(
    '/:id/options',
    authenticate,
    authorize('invigilator'),
    questionIdValidator,
    optionValidator,
    validate,
    questionController.addOption
);

/**
 * @route   PUT /api/v1/questions/:id/options/:optionId
 * @desc    Update MCQ option
 * @access  Admin, Super User, Invigilator
 */
router.put(
    '/:id/options/:optionId',
    authenticate,
    authorize('invigilator'),
    questionIdValidator,
    optionIdValidator,
    optionValidator,
    validate,
    questionController.updateOption
);

/**
 * @route   DELETE /api/v1/questions/:id/options/:optionId
 * @desc    Delete MCQ option
 * @access  Admin, Super User, Invigilator
 */
router.delete(
    '/:id/options/:optionId',
    authenticate,
    authorize('invigilator'),
    questionIdValidator,
    optionIdValidator,
    validate,
    questionController.deleteOption
);

module.exports = router;
