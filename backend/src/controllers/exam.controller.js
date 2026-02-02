/**
 * Exam Controller
 * Handles exam CRUD operations and question assignment
 */

const ApiResponse = require('../utils/apiResponse');
const { Exam, Question, ExamQuestion, MCQOption } = require('../models');
const { Op } = require('sequelize');

/**
 * Create new exam
 * @route POST /api/v1/exams
 * @access Admin, Super User, Invigilator
 */
const createExam = async (req, res, next) => {
    try {
        const {
            exam_title,
            description,
            scheduled_start,
            scheduled_end,
            duration_minutes,
            passing_score,
            allowed_designations,
        } = req.body;

        const exam = await Exam.create({
            exam_title,
            description,
            category_id: null, // No longer using categories
            scheduled_start,
            scheduled_end,
            duration_minutes,
            passing_score: passing_score || 50.0,
            allowed_designations: req.user.role === 'invigilator'
                ? JSON.stringify([req.user.designation])
                : (allowed_designations ? JSON.stringify(allowed_designations) : null),
            created_by: req.user.id,
        });

        return ApiResponse.success(
            res,
            exam,
            'Exam created successfully',
            201
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Get all exams
 * @route GET /api/v1/exams
 * @access Public
 */
const getAllExams = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            category_id,
            is_active,
            search,
        } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (category_id) whereClause.category_id = category_id;
        if (is_active !== undefined) whereClause.is_active = is_active === 'true';
        if (search) {
            whereClause.exam_title = {
                [Op.like]: `%${search}%`,
            };
        }

        // Filter by designation for students, invigilators and unauthenticated users
        // Admins can see all exams
        if (req.user && req.user.role === 'student') {
            const userDesignation = req.user.designation;
            whereClause[Op.or] = userDesignation ? [
                { allowed_designations: null },
                { allowed_designations: { [Op.like]: `%"${userDesignation}"%` } }
            ] : [{ allowed_designations: null }];
        } else if (req.user && req.user.role === 'invigilator') {
            const userDesignation = req.user.designation;
            if (userDesignation) {
                whereClause.allowed_designations = { [Op.like]: `%"${userDesignation}"%` };
            } else {
                whereClause.created_by = req.user.id;
            }
        } else if (!req.user) {
            whereClause.allowed_designations = null;
        }

        const { count, rows: exams } = await Exam.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
        });

        return ApiResponse.success(res, {
            exams,
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
 * Get exam by ID
 * @route GET /api/v1/exams/:id
 * @access Public
 */
const getExamById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'invigilator');

        const exam = await Exam.findByPk(id, {
            include: [
                {
                    model: Question,
                    as: 'questions',
                    attributes: isStaff
                        ? undefined
                        : ['id', 'question_text', 'image_url', 'question_type', 'database_schema'],
                    through: {
                        attributes: ['question_order', 'question_weightage'],
                    },
                    include: [
                        {
                            model: MCQOption,
                            as: 'options',
                            attributes: isStaff
                                ? ['id', 'option_text', 'is_correct', 'display_order']
                                : ['id', 'option_text', 'display_order'],
                        },
                    ],
                },
            ],
        });

        if (!exam) {
            return ApiResponse.notFound(res, 'Exam not found');
        }

        return ApiResponse.success(res, exam);
    } catch (error) {
        next(error);
    }
};

/**
 * Update exam
 * @route PUT /api/v1/exams/:id
 * @access Admin, Super User
 */
const updateExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const exam = await Exam.findByPk(id);

        if (!exam) {
            return ApiResponse.notFound(res, 'Exam not found');
        }

        const isAuthorized = req.user.role === 'admin' ||
            exam.created_by === req.user.id ||
            (exam.allowed_designations && exam.allowed_designations.includes(`"${req.user.designation}"`));

        if (!isAuthorized) {
            return ApiResponse.forbidden(res, 'You are not authorized to update this exam');
        }

        if (req.user.role === 'invigilator') {
            updateData.allowed_designations = JSON.stringify([req.user.designation]);
        } else if (updateData.allowed_designations) {
            updateData.allowed_designations = JSON.stringify(updateData.allowed_designations);
        }

        await exam.update(updateData);

        const updatedExam = await Exam.findByPk(id);

        return ApiResponse.success(res, updatedExam, 'Exam updated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete exam (soft delete)
 * @route DELETE /api/v1/exams/:id
 * @access Super User
 */
const deleteExam = async (req, res, next) => {
    try {
        const { id } = req.params;

        const exam = await Exam.findByPk(id);

        if (!exam) {
            return ApiResponse.notFound(res, 'Exam not found');
        }

        const isAuthorized = req.user.role === 'admin' ||
            exam.created_by === req.user.id ||
            (exam.allowed_designations && exam.allowed_designations.includes(`"${req.user.designation}"`));

        if (!isAuthorized) {
            return ApiResponse.forbidden(res, 'You are not authorized to delete this exam');
        }

        // Hard delete with cascade (fixed in DB)
        await exam.destroy();

        return ApiResponse.success(res, null, 'Exam deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Assign questions to exam
 * @route POST /api/v1/exams/:id/questions
 * @access Admin, Super User
 */
const assignQuestions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { questions } = req.body;

        const exam = await Exam.findByPk(id);
        if (!exam) {
            return ApiResponse.notFound(res, 'Exam not found');
        }

        const isAuthorized = req.user.role === 'admin' ||
            exam.created_by === req.user.id ||
            (exam.allowed_designations && exam.allowed_designations.includes(`"${req.user.designation}"`));

        if (!isAuthorized) {
            return ApiResponse.forbidden(res, 'You are not authorized to assign questions to this exam');
        }

        // Validate all questions exist
        const questionIds = questions.map((q) => q.question_id);
        const existingQuestions = await Question.findAll({
            where: { id: questionIds, is_active: true },
        });

        if (existingQuestions.length !== questionIds.length) {
            return ApiResponse.error(res, 'One or more questions not found', 400);
        }

        // Create exam-question associations
        const examQuestions = questions.map((q) => ({
            exam_id: id,
            question_id: q.question_id,
            question_order: q.question_order,
            question_weightage: q.question_weightage,
        }));

        await ExamQuestion.bulkCreate(examQuestions, {
            updateOnDuplicate: ['question_order', 'question_weightage'],
        });

        // Calculate total weightage
        const totalWeightage = questions.reduce(
            (sum, q) => sum + parseFloat(q.question_weightage),
            0
        );

        return ApiResponse.success(res, {
            exam_id: parseInt(id),
            total_questions: questions.length,
            total_weightage: totalWeightage,
        }, 'Questions assigned successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Remove question from exam
 * @route DELETE /api/v1/exams/:id/questions/:questionId
 * @access Admin, Super User
 */
const removeQuestion = async (req, res, next) => {
    try {
        const { id, questionId } = req.params;

        const exam = await Exam.findByPk(id);
        if (!exam) {
            return ApiResponse.notFound(res, 'Exam not found');
        }

        const isAuthorized = req.user.role === 'admin' ||
            exam.created_by === req.user.id ||
            (exam.allowed_designations && exam.allowed_designations.includes(`"${req.user.designation}"`));

        if (!isAuthorized) {
            return ApiResponse.forbidden(res, 'You are not authorized to remove questions from this exam');
        }

        const examQuestionToRemove = await ExamQuestion.findOne({
            where: {
                exam_id: id,
                question_id: questionId,
            },
        });

        if (!examQuestionToRemove) {
            return ApiResponse.notFound(res, 'Question not found in this exam');
        }

        const removedOrder = examQuestionToRemove.question_order;
        await examQuestionToRemove.destroy();

        // Reorder remaining questions
        const remainingQuestions = await ExamQuestion.findAll({
            where: { exam_id: id },
            order: [['question_order', 'ASC']],
        });

        for (let i = 0; i < remainingQuestions.length; i++) {
            if (remainingQuestions[i].question_order > removedOrder) {
                await remainingQuestions[i].update({
                    question_order: i + 1
                });
            }
        }

        return ApiResponse.success(res, null, 'Question removed and exam reordered');
    } catch (error) {
        next(error);
    }
};

/**
 * Get exam questions
 * @route GET /api/v1/exams/:id/questions
 * @access Public
 */
const getExamQuestions = async (req, res, next) => {
    try {
        const { id } = req.params;

        const exam = await Exam.findByPk(id);
        if (!exam) {
            return ApiResponse.notFound(res, 'Exam not found');
        }

        const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'invigilator');

        const examQuestions = await ExamQuestion.findAll({
            where: { exam_id: id },
            include: [
                {
                    model: Question,
                    as: 'question',
                    attributes: isStaff
                        ? undefined
                        : ['id', 'question_text', 'image_url', 'question_type', 'database_schema'],
                    include: [
                        {
                            model: MCQOption,
                            as: 'options',
                            attributes: isStaff
                                ? ['id', 'option_text', 'is_correct', 'display_order']
                                : ['id', 'option_text', 'display_order'],
                        },
                    ],
                },
            ],
            order: [['question_order', 'ASC']],
        });

        return ApiResponse.success(res, {
            exam_id: parseInt(id),
            questions: examQuestions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get exam attempts
 * @route GET /api/v1/exams/:id/attempts
 * @access Admin, Invigilator
 */
const getExamAttempts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { ExamAttempt, ExamResult, User } = require('../models');

        // Check if user is admin or created this exam or matches designation
        const exam = await Exam.findByPk(id);
        if (!exam) {
            return ApiResponse.notFound(res, 'Exam not found');
        }

        if (req.user.role !== 'admin' && exam.created_by !== req.user.id) {
            // Check designation
            const userDesignation = req.user.designation;
            const isAuthorizedByDesignation = exam.allowed_designations &&
                exam.allowed_designations.includes(`"${userDesignation}"`);

            if (!isAuthorizedByDesignation) {
                return ApiResponse.forbidden(res, 'You are not authorized to view results for this exam');
            }
        }

        const attempts = await ExamAttempt.findAll({
            where: {
                exam_id: id,
                status: {
                    [Op.in]: ['submitted', 'disqualified', 'timeout']
                }
            },
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'username', 'email', 'designation']
                },
                {
                    model: ExamResult,
                    as: 'result',
                    attributes: ['total_score', 'max_score', 'percentage', 'is_passed']
                }
            ]
        });

        // Sort by score descending
        const sortedAttempts = attempts.sort((a, b) => {
            const scoreA = a.result ? parseFloat(a.result.percentage) : 0;
            const scoreB = b.result ? parseFloat(b.result.percentage) : 0;
            return scoreB - scoreA;
        });

        return ApiResponse.success(res, sortedAttempts, 'Exam attempts fetched successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Allow disqualified student to resume exam
 * @route POST /api/v1/exams/attempts/:attemptId/allow-resume
 * @access Admin, Invigilator
 */
const allowResume = async (req, res, next) => {
    const transaction = await require('../models').sequelize.transaction();
    try {
        const { attemptId } = req.params;
        const { ExamAttempt, ExamResult, Exam } = require('../models');

        const attempt = await ExamAttempt.findByPk(attemptId, {
            include: [{ model: Exam, as: 'exam' }],
            transaction
        });

        if (!attempt) {
            await transaction.rollback();
            return ApiResponse.notFound(res, 'Exam attempt not found');
        }

        // Authorization check
        const exam = attempt.exam;
        if (req.user.role !== 'admin' && exam.created_by !== req.user.id) {
            const userDesignation = req.user.designation;
            const isAuthorizedByDesignation = exam.allowed_designations &&
                exam.allowed_designations.includes(`"${userDesignation}"`);

            if (!isAuthorizedByDesignation) {
                await transaction.rollback();
                return ApiResponse.forbidden(res, 'You are not authorized to manage this exam');
            }
        }

        if (attempt.status !== 'disqualified') {
            await transaction.rollback();
            return ApiResponse.error(res, 'Only disqualified attempts can be resumed', 400);
        }

        // Reset attempt status
        await attempt.update({
            status: 'in_progress',
            submitted_at: null
        }, { transaction });

        // Delete associated result if exists
        await ExamResult.destroy({
            where: { attempt_id: attemptId },
            transaction
        });

        await transaction.commit();

        return ApiResponse.success(res, null, 'Student allowed to resume exam successfully');
    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};


module.exports = {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
    assignQuestions,
    removeQuestion,
    getExamQuestions,
    getExamAttempts,
    allowResume,
};

