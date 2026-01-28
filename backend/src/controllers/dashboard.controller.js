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

        // Exams either created by this invigilator OR matching their designation
        const examWhere = {
            [Op.or]: [
                { created_by: invigilatorId },
                designation ? { allowed_designations: { [Op.like]: `%"${designation}"%` } } : { id: -1 } // dummy if no designation
            ]
        };

        const myExams = await Exam.count({ where: examWhere });
        const myQuestions = await Question.count({ where: { created_by: invigilatorId } });

        // Get results for exams visible to this invigilator
        const examIds = await Exam.findAll({
            where: examWhere,
            attributes: ['id']
        }).then(exams => exams.map(e => e.id));

        const totalAttemptsOnMyExams = await ExamAttempt.count({
            where: { exam_id: { [Op.in]: examIds } }
        });

        return ApiResponse.success(res, {
            myExams,
            myQuestions,
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
