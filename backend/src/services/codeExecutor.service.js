/**
 * Code Executor Service
 * Integrates with Piston API for code execution
 * https://github.com/engineer-man/piston
 */

const axios = require('axios');

// Piston API endpoint (public, no auth required)
const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Language mapping for Piston API
const LANGUAGE_CONFIG = {
    python: { language: 'python', version: '3.10.0' },
    java: { language: 'java', version: '15.0.2' },
    csharp: { language: 'csharp', version: '6.12.0' },
    cpp: { language: 'cpp', version: '10.2.0' },
    javascript: { language: 'javascript', version: '18.15.0' },
    c: { language: 'c', version: '10.2.0' },
    ruby: { language: 'ruby', version: '3.0.1' },
    go: { language: 'go', version: '1.16.2' },
    rust: { language: 'rust', version: '1.68.2' },
    php: { language: 'php', version: '8.2.3' }
};

/**
 * Execute code using Piston API
 * @param {string} language - Programming language (python, java, csharp, cpp, etc.)
 * @param {string} code - Source code to execute
 * @param {string} stdin - Standard input for the program
 * @param {number} timeout - Execution timeout in milliseconds (default: 10000)
 * @returns {Promise<{success: boolean, output: string, error: string|null, executionTime: number}>}
 */
const executeCode = async (language, code, stdin = '', timeout = 10000) => {
    try {
        const langConfig = LANGUAGE_CONFIG[language.toLowerCase()];

        if (!langConfig) {
            return {
                success: false,
                output: '',
                error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_CONFIG).join(', ')}`,
                executionTime: 0
            };
        }

        const startTime = Date.now();

        const response = await axios.post(`${PISTON_API_URL}/execute`, {
            language: langConfig.language,
            version: langConfig.version,
            files: [
                {
                    name: getFileName(language),
                    content: code
                }
            ],
            stdin: stdin,
            args: [],
            compile_timeout: 10000,
            run_timeout: timeout,
            compile_memory_limit: -1,
            run_memory_limit: -1
        }, {
            timeout: timeout + 5000, // Add buffer for network latency
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const executionTime = Date.now() - startTime;
        const result = response.data;

        // Check for compilation errors
        if (result.compile && result.compile.code !== 0) {
            return {
                success: false,
                output: '',
                error: result.compile.stderr || result.compile.output || 'Compilation failed',
                executionTime
            };
        }

        // Check for runtime errors
        if (result.run.code !== 0) {
            return {
                success: false,
                output: result.run.stdout || '',
                error: result.run.stderr || 'Runtime error',
                executionTime
            };
        }

        return {
            success: true,
            output: result.run.stdout || '',
            error: null,
            executionTime
        };

    } catch (error) {
        console.error('Code execution error:', error.message);

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return {
                success: false,
                output: '',
                error: 'Execution timeout - your code took too long to run',
                executionTime: timeout
            };
        }

        return {
            success: false,
            output: '',
            error: error.response?.data?.message || error.message || 'Code execution failed',
            executionTime: 0
        };
    }
};

/**
 * Get appropriate file name for language
 */
const getFileName = (language) => {
    const fileNames = {
        python: 'main.py',
        java: 'Main.java',
        csharp: 'Program.cs',
        cpp: 'main.cpp',
        c: 'main.c',
        javascript: 'main.js',
        ruby: 'main.rb',
        go: 'main.go',
        rust: 'main.rs',
        php: 'main.php'
    };
    return fileNames[language.toLowerCase()] || 'main.txt';
};

/**
 * Run code against multiple test cases
 * @param {string} language - Programming language
 * @param {string} code - Source code
 * @param {Array<{input: string, expected_output: string}>} testCases - Test cases
 * @returns {Promise<{passed: number, total: number, results: Array, allPassed: boolean}>}
 */
const runTestCases = async (language, code, testCases) => {
    const results = [];
    let passed = 0;

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const result = await executeCode(language, code, testCase.input || '');

        const actualOutput = normalizeOutput(result.output);
        const expectedOutput = normalizeOutput(testCase.expected_output);
        const isCorrect = result.success && actualOutput === expectedOutput;

        if (isCorrect) passed++;

        results.push({
            testCaseIndex: i + 1,
            input: testCase.input || '(no input)',
            expectedOutput: testCase.expected_output,
            actualOutput: result.output,
            passed: isCorrect,
            error: result.error,
            executionTime: result.executionTime
        });
    }

    return {
        passed,
        total: testCases.length,
        percentage: Math.round((passed / testCases.length) * 100),
        allPassed: passed === testCases.length,
        results
    };
};

/**
 * Normalize output for comparison (trim whitespace, normalize line endings)
 */
const normalizeOutput = (output) => {
    if (!output) return '';
    return output
        .replace(/\r\n/g, '\n')  // Normalize line endings
        .replace(/\r/g, '\n')
        .trim();                  // Remove leading/trailing whitespace
};

/**
 * Get list of supported languages
 */
const getSupportedLanguages = () => {
    return Object.keys(LANGUAGE_CONFIG).map(key => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        version: LANGUAGE_CONFIG[key].version
    }));
};

/**
 * Check if Piston API is available
 */
const checkApiHealth = async () => {
    try {
        const response = await axios.get(`${PISTON_API_URL}/runtimes`, { timeout: 5000 });
        return {
            available: true,
            runtimes: response.data.length
        };
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
};

module.exports = {
    executeCode,
    runTestCases,
    getSupportedLanguages,
    checkApiHealth,
    normalizeOutput,
    LANGUAGE_CONFIG
};
