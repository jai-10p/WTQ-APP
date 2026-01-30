/**
 * API Routes Index
 * Central routing configuration
 */

const express = require('express');
const router = express.Router();

// Import route modules
const healthRoutes = require('./health.routes');
// const categoryRoutes = require('./category.routes'); // Removed
const examRoutes = require('./exam.routes');
const questionRoutes = require('./question.routes');
const studentRoutes = require('./student.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const dashboardRoutes = require('./dashboard.routes');
const codeRoutes = require('./code.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
// router.use('/categories', categoryRoutes); // Removed
router.use('/exams', examRoutes);
router.use('/questions', questionRoutes);
router.use('/student', studentRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/code', codeRoutes);

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Exam Portal API',
        version: '1.0.0',
        endpoints: {
            health: '/api/v1/health',
            // categories: '/api/v1/categories', // Removed
            exams: '/api/v1/exams',
            questions: '/api/v1/questions',
            student: '/api/v1/student',
            users: '/api/v1/users',
            dashboard: '/api/v1/dashboard',
        },
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
