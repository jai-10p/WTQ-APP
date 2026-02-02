/**
 * Question Controller
 * Handles question CRUD operations and MCQ options management
 */

const ApiResponse = require('../utils/apiResponse');
const { Question, MCQOption, ExamQuestion, Exam } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * Create new question with MCQ options
 * @route POST /api/v1/questions
 * @access Admin, Super User
 */
const createQuestion = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            category,
            question_text,
            image_url,
            difficulty,
            weightage,
            options,
        } = req.body;

        const question_type = req.body.question_type || 'mcq';

        // Validate at least one correct option for MCQ and Statement types
        if (question_type === 'mcq' || question_type === 'statement') {
            if (!options || !Array.isArray(options) || options.length === 0) {
                await transaction.rollback();
                return ApiResponse.error(
                    res,
                    'At least two options are required for this question type',
                    400
                );
            }

            const correctOptions = options.filter((opt) => opt.is_correct);
            if (correctOptions.length === 0) {
                await transaction.rollback();
                return ApiResponse.error(
                    res,
                    'At least one option must be marked as correct',
                    400
                );
            }
        }

        // Create question
        const question = await Question.create(
            {
                question_text,
                image_url,
                difficulty: difficulty || 'medium',
                weightage: weightage || 1.0,
                created_by: req.user.id,
                question_type,
                category: category || 'General',
                reference_solution: req.body.reference_solution,
                database_schema: req.body.database_schema,
            },
            { transaction }
        );

        // Create MCQ options if provided (for MCQ/Statement types)
        if (options && Array.isArray(options) && options.length > 0) {
            const mcqOptions = options.map((opt, index) => ({
                question_id: question.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                display_order: opt.display_order || index + 1,
            }));

            await MCQOption.bulkCreate(mcqOptions, { transaction });
        }

        await transaction.commit();

        // Fetch question with options
        const questionWithOptions = await Question.findByPk(question.id, {
            include: [
                { model: MCQOption, as: 'options' },
            ],
        });

        return ApiResponse.success(
            res,
            questionWithOptions,
            'Question created successfully',
            201
        );
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

/**
 * Get all questions
 * @route GET /api/v1/questions
 * @access Public
 */
const getAllQuestions = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            difficulty,
            is_active,
            search,
        } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (category) whereClause.category = category;
        if (difficulty) whereClause.difficulty = difficulty;
        if (is_active !== undefined) whereClause.is_active = is_active === 'true';
        if (search) {
            whereClause.question_text = {
                [Op.like]: `%${search}%`,
            };
        }

        const { count, rows: questions } = await Question.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: MCQOption,
                    as: 'options',
                    attributes: ['id', 'option_text', 'is_correct', 'display_order'],
                },
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
        });

        return ApiResponse.success(res, {
            questions,
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
 * Get question by ID
 * @route GET /api/v1/questions/:id
 * @access Public
 */
const getQuestionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const question = await Question.findByPk(id, {
            include: [
                {
                    model: MCQOption,
                    as: 'options',
                    order: [['display_order', 'ASC']],
                },
            ],
        });

        if (!question) {
            return ApiResponse.notFound(res, 'Question not found');
        }

        return ApiResponse.success(res, question);
    } catch (error) {
        next(error);
    }
};

/**
 * Update question
 * @route PUT /api/v1/questions/:id
 * @access Admin, Super User
 */
const updateQuestion = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            category,
            question_text,
            image_url,
            difficulty,
            weightage,
            is_active,
            options,
        } = req.body;

        const question = await Question.findByPk(id, {
            include: [{
                model: Exam,
                as: 'exams',
                attributes: ['id', 'created_by', 'allowed_designations']
            }]
        });

        if (!question) {
            await transaction.rollback();
            return ApiResponse.notFound(res, 'Question not found');
        }

        const isAuthorized = req.user.role === 'admin' ||
            req.user.role === 'invigilator' ||
            question.created_by === req.user.id ||
            (question.exams && question.exams.some(exam =>
                exam.created_by === req.user.id ||
                (exam.allowed_designations && exam.allowed_designations.includes(`"${req.user.designation}"`))
            ));

        if (!isAuthorized) {
            await transaction.rollback();
            return ApiResponse.forbidden(res, 'You are not authorized to update this question');
        }

        const qt = req.body.question_type || question.question_type;

        // Validate options if it's an MCQ or Statement type
        if (qt === 'mcq' || qt === 'statement') {
            if (options && options.length > 0) {
                const correctOptions = options.filter((opt) => opt.is_correct);
                if (correctOptions.length === 0) {
                    await transaction.rollback();
                    return ApiResponse.error(
                        res,
                        'At least one option must be marked as correct',
                        400
                    );
                }
            }
        }

        await question.update({
            question_text,
            image_url,
            difficulty,
            weightage,
            is_active,
            category,
            question_type: req.body.question_type,
            reference_solution: req.body.reference_solution,
            database_schema: req.body.database_schema,
        }, { transaction });

        // Update options if provided OR if changing from MCQ/Statement to another type
        if (options && options.length > 0) {
            // Delete existing options
            await MCQOption.destroy({ where: { question_id: id }, transaction });

            // Create new options
            const mcqOptions = options.map((opt, index) => ({
                question_id: id,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                display_order: opt.display_order || index + 1,
            }));
            await MCQOption.bulkCreate(mcqOptions, { transaction });
        } else if (qt !== 'mcq' && qt !== 'statement') {
            // If changing to a non-MCQ type, clear any existing options
            await MCQOption.destroy({ where: { question_id: id }, transaction });
        }

        await transaction.commit();

        const updatedQuestion = await Question.findByPk(id, {
            include: [
                { model: MCQOption, as: 'options' },
            ],
        });

        return ApiResponse.success(
            res,
            updatedQuestion,
            'Question updated successfully'
        );
    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    }
};

/**
 * Delete question (soft delete)
 * @route DELETE /api/v1/questions/:id
 * @access Super User
 */
const deleteQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;

        const question = await Question.findByPk(id, {
            include: [{
                model: Exam,
                as: 'exams',
                attributes: ['id', 'created_by', 'allowed_designations']
            }]
        });

        if (!question) {
            return ApiResponse.notFound(res, 'Question not found');
        }

        const isAuthorized = req.user.role === 'admin' ||
            req.user.role === 'invigilator' ||
            question.created_by === req.user.id ||
            (question.exams && question.exams.some(exam =>
                exam.created_by === req.user.id ||
                (exam.allowed_designations && exam.allowed_designations.includes(`"${req.user.designation}"`))
            ));

        if (!isAuthorized) {
            return ApiResponse.forbidden(res, 'You are not authorized to delete this question');
        }

        // Hard delete with cascade
        await question.destroy();

        return ApiResponse.success(res, null, 'Question deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Add MCQ option to question
 * @route POST /api/v1/questions/:id/options
 * @access Admin, Super User
 */
const addOption = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { option_text, is_correct, display_order } = req.body;

        const question = await Question.findByPk(id);
        if (!question) {
            return ApiResponse.notFound(res, 'Question not found');
        }

        if (req.user.role !== 'admin' && question.created_by !== req.user.id) {
            return ApiResponse.forbidden(res, 'You are not authorized to add options to this question');
        }

        const option = await MCQOption.create({
            question_id: id,
            option_text,
            is_correct: is_correct || false,
            display_order: display_order || 1,
        });

        return ApiResponse.success(res, option, 'Option added successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Update MCQ option
 * @route PUT /api/v1/questions/:id/options/:optionId
 * @access Admin, Super User
 */
const updateOption = async (req, res, next) => {
    try {
        const { id, optionId } = req.params;
        const updateData = req.body;

        const option = await MCQOption.findOne({
            where: { id: optionId, question_id: id },
        });

        if (!option) {
            return ApiResponse.notFound(res, 'Option not found');
        }

        // Check question ownership
        const question = await Question.findByPk(id);
        if (req.user.role !== 'admin' && question.created_by !== req.user.id) {
            return ApiResponse.forbidden(res, 'You are not authorized to update options for this question');
        }

        await option.update(updateData);

        return ApiResponse.success(res, option, 'Option updated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete MCQ option
 * @route DELETE /api/v1/questions/:id/options/:optionId
 * @access Admin, Super User
 */
const deleteOption = async (req, res, next) => {
    try {
        const { id, optionId } = req.params;

        // Check if question has more than one option
        const optionCount = await MCQOption.count({ where: { question_id: id } });
        if (optionCount <= 2) {
            return ApiResponse.error(
                res,
                'Question must have at least 2 options',
                400
            );
        }

        const deleted = await MCQOption.destroy({
            where: { id: optionId, question_id: id },
        });

        if (!deleted) {
            return ApiResponse.notFound(res, 'Option not found');
        }

        // Check question ownership
        const question = await Question.findByPk(id);
        if (req.user.role !== 'admin' && question.created_by !== req.user.id) {
            return ApiResponse.forbidden(res, 'You are not authorized to delete options for this question');
        }

        return ApiResponse.success(res, null, 'Option deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Upload question image
 * @route POST /api/v1/questions/upload-image
 * @access Admin, Super User
 */
const uploadQuestionImages = async (req, res, next) => {
    try {
        console.log('📥 Upload images request received');
        console.log('Files:', req.files ? req.files.length : 0);

        if (!req.files || req.files.length === 0) {
            console.log('❌ No files in request');
            return ApiResponse.error(res, 'No images provided', 400);
        }

        const imagePaths = req.files.map(file => {
            const path = `/uploads/questions/${file.filename}`;
            console.log('✅ File uploaded:', file.filename, '→', path);
            return path;
        });

        console.log('📤 Returning', imagePaths.length, 'image URLs');
        return ApiResponse.success(res, { image_urls: imagePaths }, 'Images uploaded successfully');
    } catch (error) {
        console.error('❌ Upload error:', error);
        next(error);
    }
};

const uploadQuestionImage = async (req, res, next) => {
    try {
        if (!req.file) {
            // Check if multiple were sent instead
            if (req.files && req.files.length > 0) {
                const imagePath = `/uploads/questions/${req.files[0].filename}`;
                return ApiResponse.success(res, { image_url: imagePath }, 'Image uploaded successfully');
            }
            return ApiResponse.error(res, 'No image file provided', 400);
        }

        // Return the relative path to the image
        const imagePath = `/uploads/questions/${req.file.filename}`;

        return ApiResponse.success(res, { image_url: imagePath }, 'Image uploaded successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk upload questions via CSV
 * @route POST /api/v1/questions/bulk-upload
 * @access Admin, Super User
 */
const bulkUploadQuestions = async (req, res, next) => {
    let transaction;
    try {
        if (!req.file) {
            return ApiResponse.error(res, 'No CSV file provided', 400);
        }

        const filePath = req.file.path;
        const { parseQuestionCSV, verifyCategories } = require('../utils/csvParser.util');

        // 1. Parse and validate CSV rows
        const parseResult = await parseQuestionCSV(filePath);

        // 2. Verify categories exist
        const verification = await verifyCategories(parseResult.successful);

        const validRows = verification.validRows;
        const invalidRows = [...parseResult.errors, ...verification.invalidRows];

        if (validRows.length === 0) {
            return ApiResponse.error(
                res,
                'No valid rows found in CSV',
                400,
                { errors: invalidRows }
            );
        }

        // 3. Bulk insert valid questions
        transaction = await sequelize.transaction();

        const createdQuestions = [];

        for (const row of validRows) {
            // Create question
            const question = await Question.create({
                category_id: row.category_id,
                question_text: row.question_text,
                image_url: row.image_url,
                difficulty: row.difficulty,
                weightage: row.weightage,
                created_by: req.user.id,
            }, { transaction });

            // Create options
            const options = row.options.map(opt => ({
                question_id: question.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
                display_order: opt.display_order,
            }));

            await MCQOption.bulkCreate(options, { transaction });
            createdQuestions.push(question.id);
        }

        await transaction.commit();

        // 4. Return results
        return ApiResponse.success(res, {
            total_processed: parseResult.total,
            successful: createdQuestions.length,
            failed: invalidRows.length,
            created_ids: createdQuestions,
            errors: invalidRows,
        }, 'Bulk upload completed');

    } catch (error) {
        if (transaction) await transaction.rollback();
        next(error);
    } finally {
        // Clean up uploaded file
        if (req.file) {
            const fs = require('fs');
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('Failed to delete temp CSV file:', e);
            }
        }
    }
};

/**
 * Run and test SQL query
 * @route POST /api/v1/questions/run-sql
 * @access Student, Admin
 */
const runSQL = async (req, res, next) => {
    let transaction;
    try {
        const { sql, database_schema } = req.body;

        if (!sql) {
            return ApiResponse.error(res, 'SQL query is required', 400);
        }

        // 1. Start a transaction
        transaction = await sequelize.transaction();

        try {
            // Security Check for student SQL
            const sqlNoComments = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
            const cleanSql = sqlNoComments.trim();

            // Allow a single semicolon at the end, but block multiple statements
            const hasMultipleStatements = cleanSql.replace(/;$/, '').includes(';');

            const dangerousKeywords = ['DROP', 'TRUNCATE', 'ALTER', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'GRANT', 'REVOKE', 'REPLACE', 'RENAME'];
            const dangerousRegex = new RegExp(`\\b(${dangerousKeywords.join('|')})\\b`, 'i');

            if (hasMultipleStatements || dangerousRegex.test(cleanSql)) {
                return ApiResponse.error(res, 'Dangerous SQL detected. Only single SELECT statements are allowed.', 400);
            }

            // Block access to sensitive tables
            const sensitiveTables = ['users', 'exams', 'exam_attempts', 'student_answers', 'exam_results', 'exam_questions', 'sessions', 'categories'];
            const sensitiveRegex = new RegExp(`\\b(${sensitiveTables.join('|')})\\b`, 'i');

            if (sensitiveRegex.test(cleanSql)) {
                return ApiResponse.error(res, 'Access to system tables is restricted.', 403);
            }

            // 2. Disable ONLY_FULL_GROUP_BY for this session to be more student-friendly
            await sequelize.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));", { transaction });

            // 3. Set up the schema if provided
            if (database_schema) {
                // SANDBOX TRICK: Convert all CREATE TABLE to CREATE TEMPORARY TABLE
                // This prevents "Implicit Commits" and ensures isolation between students/runs.
                const sandboxSchema = database_schema.replace(/\bCREATE\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?)([a-zA-Z0-9_]+)\1/gi, 'DROP TEMPORARY TABLE IF EXISTS $1$2$1; CREATE TEMPORARY TABLE $1$2$1');

                const statements = sandboxSchema.split(';').filter(s => s.trim());
                for (const statement of statements) {
                    await sequelize.query(statement, { transaction });
                }
            }

            // 3. Run the student query
            const [results] = await sequelize.query(sql, { transaction });

            // 4. Rollback to keep database clean (Temporary tables in InnoDB roll back!)
            await transaction.rollback();

            return ApiResponse.success(res, results, 'SQL executed successfully');
        } catch (error) {
            console.error('SQL Execution Inner Error:', error);
            if (transaction) {
                try { await transaction.rollback(); } catch (e) { }
            }
            return ApiResponse.error(res, error.message, 400);
        }
    } catch (error) {
        console.error('SQL Execution Outer Error:', error);
        next(error);
    }
};

/**
 * Download CSV template
 * @route GET /api/v1/questions/csv-template
 * @access Public
 */
const downloadCSVTemplate = async (req, res, next) => {
    try {
        const csvContent = 'category_id,question_text,difficulty,weightage,option_1,option_1_correct,option_2,option_2_correct,option_3,option_3_correct,option_4,option_4_correct,image_url\n1,"Example Question?",medium,1.0,"Option A",true,"Option B",false,"Option C",false,"Option D",false,';

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=questions_template.csv');
        res.send(csvContent);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createQuestion,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    addOption,
    updateOption,
    deleteOption,
    uploadQuestionImage,
    uploadQuestionImages,
    bulkUploadQuestions,
    downloadCSVTemplate,
    runSQL,
};
