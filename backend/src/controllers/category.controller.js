/**
 * Category Controller
 * Handles category CRUD operations
 */

const ApiResponse = require('../utils/apiResponse');
const { Category, Question, Exam } = require('../models');
const { Op } = require('sequelize');

/**
 * Create new category
 * @route POST /api/v1/categories
 * @access Admin, Super User
 */
const createCategory = async (req, res, next) => {
    try {
        const { category_name, description } = req.body;

        const category = await Category.create({
            category_name,
            description,
        });

        return ApiResponse.success(
            res,
            category,
            'Category created successfully',
            201
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get all categories
 * @route GET /api/v1/categories
 * @access Public
 */
const getAllCategories = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (search) {
            whereClause.category_name = {
                [Op.like]: `%${search}%`,
            };
        }

        const { count, rows: categories } = await Category.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['category_name', 'ASC']],
        });

        return ApiResponse.success(res, {
            categories,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get category by ID
 * @route GET /api/v1/categories/:id
 * @access Public
 */
const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id, {
            include: [
                {
                    model: Exam,
                    as: 'exams',
                    attributes: ['id', 'exam_title', 'scheduled_start', 'is_active'],
                    where: { is_active: true },
                    required: false,
                },
                {
                    model: Question,
                    as: 'questions',
                    attributes: ['id', 'question_text', 'difficulty', 'is_active'],
                    where: { is_active: true },
                    required: false,
                },
            ],
        });

        if (!category) {
            return ApiResponse.notFound(res, 'Category not found');
        }

        return ApiResponse.success(res, category);
    } catch (error) {
        next(error);
    }
};

/**
 * Update category
 * @route PUT /api/v1/categories/:id
 * @access Admin, Super User
 */
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { category_name, description } = req.body;

        const category = await Category.findByPk(id);

        if (!category) {
            return ApiResponse.notFound(res, 'Category not found');
        }

        await category.update({
            category_name: category_name || category.category_name,
            description: description !== undefined ? description : category.description,
        });

        return ApiResponse.success(res, category, 'Category updated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete category
 * @route DELETE /api/v1/categories/:id
 * @access Super User
 */
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);

        if (!category) {
            return ApiResponse.notFound(res, 'Category not found');
        }

        // Check if category has associated exams or questions
        const examCount = await Exam.count({ where: { category_id: id } });
        const questionCount = await Question.count({ where: { category_id: id } });

        if (examCount > 0 || questionCount > 0) {
            return ApiResponse.error(
                res,
                'Cannot delete category with associated exams or questions',
                400
            );
        }

        await category.destroy();

        return ApiResponse.success(res, null, 'Category deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
