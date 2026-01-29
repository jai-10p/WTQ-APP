/**
 * Student Controller
 * Handles student exam execution and results
 */

const ApiResponse = require('../utils/apiResponse');
const {
    Exam,
    Question,
    ExamQuestion,
    MCQOption,
    ExamAttempt,
    StudentAnswer,
    ExamResult,
    sequelize
} = require('../models');
const { Op } = require('sequelize');

/**
 * Get available exams for student
 * @route GET /api/v1/student/exams
 */
const getAvailableExams = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, category_id, search } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { is_active: true };
        if (category_id) whereClause.category_id = category_id;
        if (search) {
            whereClause.exam_title = { [Op.like]: `%${search}%` };
        }

        // Filter by designation for students
        // Admins and teachers can see all active exams
        if (req.user.role === 'student') {
            const userDesignation = req.user.designation;

            if (userDesignation) {
                whereClause[Op.or] = [
                    { allowed_designations: null }, // Visible to all
                    { allowed_designations: { [Op.like]: `%"${userDesignation}"%` } } // Visible to specific designation
                ];
            } else {
                // If student has no designation, they only see public exams
                whereClause.allowed_designations = null;
            }
        }

        const { count, rows: rawExams } = await Exam.findAndCountAll({
            where: whereClause,
            include: [{
                model: ExamAttempt,
                as: 'attempts',
                where: { student_id: req.user.id },
                required: false,
                attributes: ['id', 'status'],
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['created_at', 'DESC'],
                [{ model: ExamAttempt, as: 'attempts' }, 'started_at', 'DESC']
            ],
        });

        // Map attempt status back to simple form for frontend
        const exams = rawExams.map(exam => {
            const latestAttempt = exam.attempts && exam.attempts.length > 0 ? exam.attempts[0] : null;
            const plainExam = exam.get({ plain: true });
            delete plainExam.attempts;
            return {
                ...plainExam,
                attempt_status: latestAttempt ? latestAttempt.status : null
            };
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
 * Start an exam attempt
 * @route POST /api/v1/student/exams/:id/start
 */
const startExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const studentId = req.user.id;

        // 1. Check if exam exists and is active
        const exam = await Exam.findByPk(id);
        if (!exam || !exam.is_active) {
            return ApiResponse.notFound(res, 'Exam not found or inactive');
        }

        // 2. Check schedule
        const now = new Date();
        if (now < new Date(exam.scheduled_start)) {
            return ApiResponse.error(res, 'Exam has not started yet', 400);
        }
        if (now > new Date(exam.scheduled_end)) {
            return ApiResponse.error(res, 'Exam has ended', 400);
        }

        // 3. Check for existing in-progress attempt
        const existingAttempt = await ExamAttempt.findOne({
            where: {
                exam_id: id,
                student_id: studentId,
                status: 'in_progress',
            },
        });

        if (existingAttempt) {
            // Resume existing attempt
            return ApiResponse.success(res, {
                attempt_id: existingAttempt.id,
                started_at: existingAttempt.started_at,
                exam_duration: exam.duration_minutes,
                message: 'Resuming existing attempt',
            });
        }

        // 4. Check for completed attempts (prevent retake if not allowed - simplified logic: only 1 attempt allowed)
        const completedAttempt = await ExamAttempt.findOne({
            where: {
                exam_id: id,
                student_id: studentId,
                status: { [Op.in]: ['submitted', 'abandoned', 'timeout'] },
            },
        });

        if (completedAttempt) {
            return ApiResponse.error(res, 'You have already attempted this exam', 400);
        }

        // 5. Create new attempt
        const attempt = await ExamAttempt.create({
            exam_id: id,
            student_id: studentId,
            started_at: new Date(),
            status: 'in_progress',
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
        });

        return ApiResponse.success(res, {
            attempt_id: attempt.id,
            started_at: attempt.started_at,
            exam_duration: exam.duration_minutes,
        }, 'Exam started successfully');

    } catch (error) {
        next(error);
    }
};

const getAttemptQuestions = async (req, res, next) => {
    try {
        const { attemptId } = req.params;
        const studentId = req.user.id;

        // Verify attempt ownership and fetch exam with its assigned questions
        const attempt = await ExamAttempt.findOne({
            where: { id: attemptId, student_id: studentId },
            include: [{
                model: Exam,
                as: 'exam',
                include: [{
                    model: Question,
                    as: 'questions',
                    through: {
                        as: 'exam_question_link',
                        attributes: ['id', 'question_order', 'question_weightage']
                    },
                    include: [{
                        model: MCQOption,
                        as: 'options',
                        attributes: ['id', 'option_text', 'display_order']
                    }],
                    attributes: ['id', 'question_text', 'image_url', 'question_type', 'database_schema']
                }]
            }],
        });

        if (!attempt) {
            return ApiResponse.notFound(res, 'Exam attempt not found');
        }

        if (!attempt.exam) {
            return ApiResponse.error(res, 'Linked exam not found', 404);
        }

        // Fetch existing answers for this attempt
        const answers = await StudentAnswer.findAll({
            where: { attempt_id: attemptId }
        });

        const formattedQuestions = attempt.exam.questions.map(q => {
            const junction = q.exam_question_link;
            const answer = answers.find(a => a.exam_question_id === junction.id);
            return {
                id: junction.id, // junction ID
                question_id: q.id,
                question_order: junction.question_order,
                question_weightage: parseFloat(junction.question_weightage),
                answer: answer ? {
                    selected_option_id: answer.selected_option_id,
                    answer_text: answer.answer_text
                } : null,
                question: {
                    id: q.id,
                    question_text: q.question_text,
                    image_url: q.image_url,
                    question_type: q.question_type,
                    database_schema: q.database_schema,
                    options: q.options
                }
            };
        });

        // Sort by order
        formattedQuestions.sort((a, b) => a.question_order - b.question_order);

        return ApiResponse.success(res, {
            attempt_id: attempt.id,
            exam_title: attempt.exam.exam_title,
            remaining_time: calculateRemainingTime(attempt.started_at, attempt.exam.duration_minutes),
            questions: formattedQuestions,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Submit an answer
 * @route POST /api/v1/student/attempts/:attemptId/answer
 */
const submitAnswer = async (req, res, next) => {
    try {
        const { attemptId } = req.params;
        const { question_id, selected_option_id } = req.body; // question_id here refers to Question.id, but we need ExamQuestion.id
        // OR the frontend sends ExamQuestion.id. Let's assume frontend has ExamQuestion info from getAttemptQuestions.
        // Actually, looking at getAttemptQuestions, we return ExamQuestion objects. So let's use exam_question_id from the body.
        // WAITING: Wait, the frontend might send question_id (from Question model) comfortably. 
        // Let's support question_id finding the corresponding ExamQuestion.

        // Better approach: use exam_question_id directly if possible. But let's assume we receive exam_question_id for precision.
        const exam_question_id = req.body.exam_question_id || req.body.question_id;

        const studentId = req.user.id;

        // 1. Verify attempt
        const attempt = await ExamAttempt.findOne({
            where: { id: attemptId, student_id: studentId },
            include: [{ model: Exam, as: 'exam' }],
        });

        if (!attempt) return ApiResponse.notFound(res, 'Attempt not found');
        if (attempt.status !== 'in_progress') return ApiResponse.error(res, 'Exam is already submitted or closed', 400);

        // 2. Check time validity
        if (isTimeExpired(attempt.started_at, attempt.exam.duration_minutes)) {
            // Auto-close logic could be triggered here, but for now just reject answer
            return ApiResponse.error(res, 'Time has expired', 400);
        }

        // 3. Find ExamQuestion to ensure it belongs to this exam
        // Note: The input might be the raw question_id or the exam_question junction id.
        // Let's assume it's the ExamQuestion.id (junction ID) for uniqueness within the exam context.
        // However, if the user sends raw question_id, we need to map it.
        // Let's assume strict usage: exam_question_id is required.

        // Check if the exam_question_id belongs to the exam
        const examQuestion = await ExamQuestion.findOne({
            where: { id: exam_question_id, exam_id: attempt.exam_id }
        });

        if (!examQuestion) {
            // Fallback: search by raw question_id
            if (req.body.question_id) {
                const eq = await ExamQuestion.findOne({
                    where: { question_id: req.body.question_id, exam_id: attempt.exam_id }
                });
                if (!eq) return ApiResponse.notFound(res, 'Question not found in this exam');
            } else {
                return ApiResponse.notFound(res, 'Question not found in this exam');
            }
        }

        // 4. Save/Update answer
        // We use upsert-like logic: find existing answer for this question and update, or create new.

        // Actually Sequelize upsert or findOne then update
        const existingAnswer = await StudentAnswer.findOne({
            where: {
                attempt_id: attempt.id,
                exam_question_id: exam_question_id
            }
        });

        if (existingAnswer) {
            await existingAnswer.update({
                selected_option_id: selected_option_id || null,
                answer_text: req.body.answer_text || null,
                answered_at: new Date()
            });
        } else {
            await StudentAnswer.create({
                attempt_id: attempt.id,
                exam_question_id: exam_question_id,
                selected_option_id: selected_option_id || null,
                answer_text: req.body.answer_text || null
            });
        }

        return ApiResponse.success(res, null, 'Answer saved');

    } catch (error) {
        next(error);
    }
};

/**
 * Submit exam and calculate result
 * @route POST /api/v1/student/attempts/:attemptId/submit
 */
const submitExam = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { attemptId } = req.params;
        const studentId = req.user.id;

        const attempt = await ExamAttempt.findOne({
            where: { id: attemptId, student_id: studentId },
            include: [{ model: Exam, as: 'exam' }]
        });

        if (!attempt) {
            await transaction.rollback();
            return ApiResponse.notFound(res, 'Attempt not found');
        }

        if (attempt.status !== 'in_progress') {
            await transaction.rollback();
            // Just return the existing result if already submitted
            const existingResult = await ExamResult.findOne({ where: { attempt_id: attempt.id } });
            return ApiResponse.success(res, existingResult, 'Exam already submitted');
        }

        // 1. Mark as submitted
        const status = isTimeExpired(attempt.started_at, attempt.exam.duration_minutes) ? 'timeout' : 'submitted';
        await attempt.update({
            status: status,
            submitted_at: new Date()
        }, { transaction });

        // 2. Calculate Score
        // Fetch all answers with question weightage and option correctness
        const answers = await StudentAnswer.findAll({
            where: { attempt_id: attempt.id },
            include: [
                {
                    model: ExamQuestion,
                    as: 'exam_question',
                    attributes: ['question_weightage'],
                    include: [{
                        model: Question,
                        as: 'question',
                        attributes: ['question_type', 'reference_solution', 'database_schema']
                    }]
                },
                {
                    model: MCQOption,
                    as: 'selected_option',
                    attributes: ['is_correct']
                }
            ],
            transaction
        });

        // Fetch max score possible (sum of all question weightages in the exam)
        const allExamQuestions = await ExamQuestion.findAll({
            where: { exam_id: attempt.exam_id },
            attributes: ['question_weightage'],
            transaction
        });

        const maxScore = allExamQuestions.reduce((sum, q) => sum + parseFloat(q.question_weightage), 0);

        // Calculate obtained score
        let totalScore = 0;
        let correctCount = 0;

        for (const ans of answers) {
            const question = ans.exam_question.question;
            const weightage = parseFloat(ans.exam_question.question_weightage);

            if (question.question_type === 'mcq') {
                if (ans.selected_option && ans.selected_option.is_correct) {
                    totalScore += weightage;
                    correctCount++;
                }
            } else if (question.question_type === 'sql') {
                if (ans.answer_text) {
                    const isCorrect = await evaluateSQLAnswer(
                        ans.answer_text,
                        question.reference_solution,
                        question.database_schema
                    );
                    if (isCorrect) {
                        totalScore += weightage;
                        correctCount++;
                    }
                }
            }
        }

        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        const isPassed = percentage >= attempt.exam.passing_score;

        // 3. Create Result
        const result = await ExamResult.create({
            attempt_id: attempt.id,
            total_score: totalScore,
            max_score: maxScore,
            percentage: percentage,
            correct_answers: correctCount,
            total_questions: allExamQuestions.length,
            is_passed: isPassed
        }, { transaction });

        // 4. Prepare detailed breakdown
        const breakdown = await getResultBreakdown(attempt.id, transaction);

        await transaction.commit();

        return ApiResponse.success(res, {
            ...result.toJSON(),
            breakdown
        }, 'Exam submitted successfully');

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

/**
 * Get exam result
 * @route GET /api/v1/student/attempts/:attemptId/result
 */
const getExamResult = async (req, res, next) => {
    try {
        const { attemptId } = req.params;
        const studentId = req.user.id;
        const userRole = req.user.role;

        // Configuration for where clause: students can only see their own, admins/invigilators can see all 
        const whereClause = { id: attemptId };
        if (userRole === 'student') {
            whereClause.student_id = studentId;
        }

        const attempt = await ExamAttempt.findOne({
            where: whereClause,
            include: [{ model: ExamResult, as: 'result' }]
        });

        if (!attempt) return ApiResponse.notFound(res, 'Attempt not found');
        if (attempt.status === 'in_progress') return ApiResponse.error(res, 'Exam is still in progress', 400);
        if (!attempt.result) return ApiResponse.notFound(res, 'Result not found');

        const breakdown = await getResultBreakdown(attemptId);

        return ApiResponse.success(res, {
            ...attempt.result.toJSON(),
            breakdown
        });
    } catch (error) {
        next(error);
    }
};

// Helper: Get Result Breakdown
const getResultBreakdown = async (attemptId, transaction = null) => {
    const answers = await StudentAnswer.findAll({
        where: { attempt_id: attemptId },
        include: [
            {
                model: ExamQuestion,
                as: 'exam_question',
                include: [{
                    model: Question,
                    as: 'question',
                    attributes: ['question_text', 'question_type', 'reference_solution', 'database_schema']
                }]
            },
            {
                model: MCQOption,
                as: 'selected_option',
                attributes: ['id', 'option_text', 'is_correct']
            }
        ],
        transaction
    });

    const breakdown = [];
    for (const ans of answers) {
        const question = ans.exam_question.question;
        const weightage = parseFloat(ans.exam_question.question_weightage);
        let isCorrect = false;
        let displayAnswer = 'Not Answered';

        if (question.question_type === 'mcq') {
            displayAnswer = ans.selected_option ? ans.selected_option.option_text : 'Not Answered';
            isCorrect = ans.selected_option ? ans.selected_option.is_correct : false;
        } else if (question.question_type === 'sql') {
            displayAnswer = ans.answer_text || 'Not Answered';
            if (ans.answer_text) {
                isCorrect = await evaluateSQLAnswer(
                    ans.answer_text,
                    question.reference_solution,
                    question.database_schema
                );
            }
        }

        breakdown.push({
            question_id: question.id,
            exam_question_id: ans.exam_question_id,
            question_text: question.question_text,
            question_type: question.question_type,
            selected_option: displayAnswer,
            is_correct: isCorrect,
            weightage: weightage,
            score: isCorrect ? weightage : 0
        });
    }

    return breakdown;
};

// Helper: Check if time expired
const isTimeExpired = (startedAt, durationMinutes) => {
    const endTime = new Date(new Date(startedAt).getTime() + durationMinutes * 60000);
    // Add 2 minute grace period for network latency
    const graceTime = new Date(endTime.getTime() + 2 * 60000);
    return new Date() > graceTime;
};

// Helper: Calculate remaining seconds
const calculateRemainingTime = (startedAt, durationMinutes) => {
    const endTime = new Date(new Date(startedAt).getTime() + durationMinutes * 60000);
    const remaining = Math.floor((endTime - new Date()) / 1000);
    return remaining > 0 ? remaining : 0;
};

/**
 * Get results for the authenticated student
 * @route GET /api/v1/student/results
 */
const getMyResults = async (req, res, next) => {
    try {
        const studentId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: attempts } = await ExamAttempt.findAndCountAll({
            where: {
                student_id: studentId,
                status: { [Op.in]: ['submitted', 'timeout'] }
            },
            include: [
                {
                    model: Exam,
                    as: 'exam',
                    attributes: ['exam_title', 'passing_score']
                },
                {
                    model: ExamResult,
                    as: 'result'
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['submitted_at', 'DESC']]
        });

        return ApiResponse.success(res, {
            results: attempts,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper: Evaluate SQL Answer
const evaluateSQLAnswer = async (studentSQL, referenceSQL, schema) => {
    try {
        const transaction = await sequelize.transaction();
        try {
            if (schema) {
                // SANDBOX TRICK: Convert all CREATE TABLE to CREATE TEMPORARY TABLE
                const sandboxSchema = schema.replace(/\bCREATE\s+(?:TEMPORARY\s+)?TABLE\b/gi, 'CREATE TEMPORARY TABLE');
                const statements = sandboxSchema.split(';').filter(s => s.trim());
                for (const s of statements) await sequelize.query(s, { transaction });
            }

            const [studentResults] = await sequelize.query(studentSQL, { transaction });
            const [referenceResults] = await sequelize.query(referenceSQL, { transaction });

            await transaction.rollback();

            // Compare results (JSON stringify is a simple way to compare row sets)
            return JSON.stringify(studentResults) === JSON.stringify(referenceResults);
        } catch (e) {
            console.error('SQL Grading Error:', e);
            if (transaction) await transaction.rollback();
            return false;
        }
    } catch (e) {
        return false;
    }
};

module.exports = {
    getAvailableExams,
    startExam,
    getAttemptQuestions,
    submitAnswer,
    submitExam,
    getExamResult,
    getMyResults,
};
