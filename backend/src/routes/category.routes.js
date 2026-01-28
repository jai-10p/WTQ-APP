/**
 * Category Routes
 * Routes for category management
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
    createCategoryValidator,
    updateCategoryValidator,
    categoryIdValidator,
} = require('../validators/category.validator');

/**
 * @route   POST /api/v1/categories
 * @desc    Create new category
 * @access  Admin, Super User
 */
router.post(
    '/',
    authenticate,
    authorize('admin'),
    createCategoryValidator,
    validate,
    categoryController.createCategory
);

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get(
    '/:id',
    categoryIdValidator,
    validate,
    categoryController.getCategoryById
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Admin
 */
router.put(
    '/:id',
    authenticate,
    authorize('admin'),
    categoryIdValidator,
    updateCategoryValidator,
    validate,
    categoryController.updateCategory
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category
 * @access  Admin
 */
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    categoryIdValidator,
    validate,
    categoryController.deleteCategory
);

module.exports = router;
