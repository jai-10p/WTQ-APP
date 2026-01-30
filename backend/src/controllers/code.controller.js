/**
 * Code Execution Controller
 * Handles code execution requests for coding questions
 */

const ApiResponse = require('../utils/apiResponse');
const codeExecutor = require('../services/codeExecutor.service');

/**
 * Execute code (for student testing)
 * @route POST /api/v1/code/execute
 */
const executeCode = async (req, res, next) => {
    try {
        const { language, code, stdin } = req.body;

        if (!language || !code) {
            return ApiResponse.error(res, 'Language and code are required', 400);
        }

        const result = await codeExecutor.executeCode(language, code, stdin || '');

        return ApiResponse.success(res, {
            success: result.success,
            output: result.output,
            error: result.error,
            executionTime: result.executionTime
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Run code against test cases (for grading)
 * @route POST /api/v1/code/run-tests
 */
const runTestCases = async (req, res, next) => {
    try {
        const { language, code, testCases } = req.body;

        if (!language || !code || !testCases || !Array.isArray(testCases)) {
            return ApiResponse.error(res, 'Language, code, and testCases array are required', 400);
        }

        if (testCases.length === 0) {
            return ApiResponse.error(res, 'At least one test case is required', 400);
        }

        const result = await codeExecutor.runTestCases(language, code, testCases);

        return ApiResponse.success(res, result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get supported languages
 * @route GET /api/v1/code/languages
 */
const getSupportedLanguages = async (req, res, next) => {
    try {
        const languages = codeExecutor.getSupportedLanguages();
        return ApiResponse.success(res, languages);
    } catch (error) {
        next(error);
    }
};

/**
 * Check API health
 * @route GET /api/v1/code/health
 */
const checkHealth = async (req, res, next) => {
    try {
        const health = await codeExecutor.checkApiHealth();
        return ApiResponse.success(res, health);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    executeCode,
    runTestCases,
    getSupportedLanguages,
    checkHealth
};
