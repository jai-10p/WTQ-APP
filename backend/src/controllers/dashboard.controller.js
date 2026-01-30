const { User, Exam, Question, ExamAttempt, ExamResult } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { Op } = require('sequelize');

/**
 * Get Admin Dashboard Stats
 */
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalExams = await Exam.count();
        const totalQuestions = await Question.count();
        const totalAttempts = await ExamAttempt.count();

        // Count by role
        const studentCount = await User.count({ where: { role: 'student' } });
        const invigilatorCount = await User.count({ where: { role: 'invigilator' } });

        return ApiResponse.success(res, {
            totalUsers,
            totalExams,
            totalQuestions,
            totalAttempts,
            roleDistribution: {
                students: studentCount,
                invigilators: invigilatorCount
            }
        }, 'Admin stats fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * Get Invigilator Dashboard Stats
 */
const getInvigilatorStats = async (req, res) => {
    try {
        const invigilatorId = req.user.id;
        const designation = req.user.designation;

        // Requirement: Show count of exams created for that designation
        // Example: If designation is 'QA', show exams where 'QA' is in allowed_designations
        const examWhere = designation
            ? { allowed_designations: { [Op.like]: `%"${designation}"%` } }
            : { created_by: invigilatorId };

        const myExams = await Exam.count({ where: examWhere });

        // Get all exam IDs for these exams
        const exams = await Exam.findAll({
            where: examWhere,
            attributes: ['id']
        });
        const examIds = exams.map(e => e.id);

        // Requirement: Show total attempts on these exams
        const totalAttemptsOnMyExams = await ExamAttempt.count({
            where: { exam_id: { [Op.in]: examIds.length > 0 ? examIds : [-1] } }
        });

        return ApiResponse.success(res, {
            myExams,
            totalAttemptsOnMyExams
        }, 'Invigilator stats fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * Get Student Dashboard Stats
 */
const getStudentStats = async (req, res) => {
    try {
        const studentId = req.user.id;

        const totalExamsAvailable = await Exam.count({ where: { is_active: true } });
        const myAttempts = await ExamAttempt.count({ where: { student_id: studentId } });

        // Average score
        const results = await ExamResult.findAll({
            include: [{
                model: ExamAttempt,
                as: 'attempt',
                where: { student_id: studentId },
                required: true
            }]
        });

        const avgScore = results.length > 0
            ? (results.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / results.length).toFixed(2)
            : 0;

        return ApiResponse.success(res, {
            totalExamsAvailable,
            myAttempts,
            averageScore: parseFloat(avgScore)
        }, 'Student stats fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

module.exports = {
    getAdminStats,
    getInvigilatorStats,
    getStudentStats
};
