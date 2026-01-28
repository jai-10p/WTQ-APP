/**
 * Health Check Routes
 * System health and status endpoints
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @route   GET /api/v1/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', healthController.healthCheck);

/**
 * @route   GET /api/v1/health/db
 * @desc    Database health check
 * @access  Public
 */
router.get('/db', healthController.databaseHealthCheck);

/**
 * @route   GET /api/v1/health/status
 * @desc    Detailed system status
 * @access  Public
 */
router.get('/status', healthController.systemStatus);

module.exports = router;
