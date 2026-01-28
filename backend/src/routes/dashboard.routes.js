const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/admin', authorize('admin'), dashboardController.getAdminStats);
router.get('/invigilator', authorize('invigilator'), dashboardController.getInvigilatorStats);
router.get('/student', authorize('student'), dashboardController.getStudentStats);

module.exports = router;
