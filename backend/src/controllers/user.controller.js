const { User, Question, Exam, ExamAttempt, StudentAnswer, ExamResult } = require('../models');
const ApiResponse = require('../utils/apiResponse');

/**
 * Get all users
 * @route GET /api/v1/users
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash'] },
            order: [['created_at', 'DESC']]
        });
        return ApiResponse.success(res, users, 'Users fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * Get user by ID
 * @route GET /api/v1/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) {
            return ApiResponse.notFound(res, 'User not found');
        }
        return ApiResponse.success(res, user, 'User fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * Update user
 * @route PUT /api/v1/users/:id
 */
const updateUser = async (req, res) => {
    try {
        const { username, email, role, is_active, designation } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return ApiResponse.notFound(res, 'User not found');
        }

        await user.update({
            username: username || user.username,
            email: email || user.email,
            role: role || user.role,
            designation: designation !== undefined ? designation : user.designation,
            is_active: is_active !== undefined ? is_active : user.is_active
        });

        const updatedUser = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password_hash'] }
        });

        return ApiResponse.success(res, updatedUser, 'User updated successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * Delete user
 * @route DELETE /api/v1/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
        if (!user) {
            return ApiResponse.notFound(res, 'User not found');
        }

        const adminId = req.user.id;

        // 1. Reassign exams and questions to the admin
        if (user.role === 'invigilator' || user.role === 'admin') {
            await Promise.all([
                Question.update({ created_by: adminId }, { where: { created_by: userId } }),
                Exam.update({ created_by: adminId }, { where: { created_by: userId } })
            ]);
        }

        // 2. Manually handle cascading for exam attempts
        // This is necessary because some DB environments might not have the correct CASCADE setup
        const attempts = await ExamAttempt.findAll({ where: { student_id: userId } });
        const attemptIds = attempts.map(a => a.id);

        if (attemptIds.length > 0) {
            await Promise.all([
                StudentAnswer.destroy({ where: { attempt_id: attemptIds } }),
                ExamResult.destroy({ where: { attempt_id: attemptIds } })
            ]);
            await ExamAttempt.destroy({ where: { id: attemptIds } });
        }

        // 3. Final deletion of the user
        await user.destroy();

        return ApiResponse.success(res, null, 'User deleted successfully. Their created content has been preserved.');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};


const bcrypt = require('bcryptjs');

/**
 * Update current user profile
 * @route PUT /api/v1/users/profile
 */
const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return ApiResponse.notFound(res, 'User not found');
        }

        await user.update({
            username: username || user.username,
            email: email || user.email
        });

        const updatedUser = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] }
        });

        return ApiResponse.success(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * Change current user password
 * @route PUT /api/v1/users/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return ApiResponse.notFound(res, 'User not found');
        }

        // Verify current password
        const isMatch = await user.comparePassword(current_password);
        if (!isMatch) {
            return ApiResponse.error(res, 'Incorrect current password', 400);
        }

        // Update password (using the model hook for hashing if available, or manual hash)
        // Assuming the model hashes on update/save.
        // Wait, User model in my context usually uses bcrypt in beforeCreate/beforeUpdate hooks.
        // Let's check User model to be sure.

        user.password_hash = await bcrypt.hash(new_password, 10);
        await user.save();

        return ApiResponse.success(res, null, 'Password changed successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

/**
 * Get all students (for invigilators/admins)
 * @route GET /api/v1/users/students
 */
const getStudents = async (req, res) => {
    try {
        const students = await User.findAll({
            where: { role: 'student' },
            attributes: { exclude: ['password_hash'] },
            order: [['username', 'ASC']]
        });
        return ApiResponse.success(res, students, 'Students fetched successfully');
    } catch (error) {
        return ApiResponse.error(res, error.message);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateProfile,
    changePassword,
    getStudents
};
