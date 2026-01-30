/**
 * Code Execution Routes
 * Routes for code execution endpoints
 */

const express = require('express');
const router = express.Router();
const codeController = require('../controllers/code.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All code execution routes require authentication
router.use(authenticate);

// Execute code (for student testing)
router.post('/execute', codeController.executeCode);

// Run code against test cases (for grading)
router.post('/run-tests', codeController.runTestCases);

// Get supported languages
router.get('/languages', codeController.getSupportedLanguages);

// Check Piston API health
router.get('/health', codeController.checkHealth);

module.exports = router;
