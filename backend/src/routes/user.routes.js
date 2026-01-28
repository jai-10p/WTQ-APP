const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Publicly accessible to all authenticated users
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Shared management routes (Admin & Invigilator)
router.get('/students', authorize('admin'), userController.getStudents);

// Management routes require admin role
router.use(authorize('admin'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
