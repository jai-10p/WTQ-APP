/**
 * CSV Parser Utility
 * Parses and validates CSV data for bulk question upload
 */

const fs = require('fs');
const csv = require('csv-parser');
const { Category } = require('../models');

/**
 * Parse CSV file and validate rows
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Object>} - Parsed results { successful: [], errors: [], total: 0 }
 */
const parseQuestionCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];
        let rowCount = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                rowCount++;
                try {
                    // Normalize keys (trim whitespace, lowercase)
                    const normalizedRow = {};
                    Object.keys(row).forEach((key) => {
                        normalizedRow[key.trim()] = row[key].trim();
                    });

                    // Validate row
                    const validation = validateRow(normalizedRow, rowCount);

                    if (validation.isValid) {
                        results.push(validation.data);
                    } else {
                        errors.push({
                            row: rowCount,
                            original_data: row,
                            errors: validation.errors,
                        });
                    }
                } catch (error) {
                    errors.push({
                        row: rowCount,
                        error: 'Failed to process row: ' + error.message,
                    });
                }
            })
            .on('end', () => {
                resolve({
                    total: rowCount,
                    successful: results,
                    errors: errors,
                });
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

/**
 * Validate a single CSV row
 * @param {Object} row - CSV row data
 * @param {number} rowNum - Row number
 * @returns {Object} - { isValid: boolean, data: Object, errors: string[] }
 */
const validateRow = (row, rowNum) => {
    const errors = [];
    const data = {};

    // 1. Category ID (Optional)
    data.category_id = (row.category_id && !isNaN(row.category_id)) ? parseInt(row.category_id) : null;

    // 2. Question Text
    if (!row.question_text) {
        errors.push('Missing question_text');
    } else {
        data.question_text = row.question_text;
    }

    // 3. Difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!row.difficulty || !validDifficulties.includes(row.difficulty.toLowerCase())) {
        errors.push('Invalid difficulty (must be easy, medium, or hard)');
    } else {
        data.difficulty = row.difficulty.toLowerCase();
    }

    // 4. Weightage
    if (row.weightage && !isNaN(row.weightage)) {
        data.weightage = parseFloat(row.weightage);
    } else {
        data.weightage = 1.0; // Default
    }

    // 5. Options validation
    data.options = [];

    // Need at least 2 options
    const option1 = validateOption(row.option_1, row.option_1_correct);
    const option2 = validateOption(row.option_2, row.option_2_correct);

    if (option1) data.options.push({ ...option1, display_order: 1 });
    if (option2) data.options.push({ ...option2, display_order: 2 });

    const option3 = validateOption(row.option_3, row.option_3_correct);
    if (option3) data.options.push({ ...option3, display_order: 3 });

    const option4 = validateOption(row.option_4, row.option_4_correct);
    if (option4) data.options.push({ ...option4, display_order: 4 });

    if (data.options.length < 2) {
        errors.push('At least 2 options (option_1, option_2) are required');
    }

    // Check correct option
    const hasCorrect = data.options.some((opt) => opt.is_correct);
    if (!hasCorrect) {
        errors.push('At least one option must be marked as correct');
    }

    // 6. Image URL (optional)
    if (row.image_url) {
        data.image_url = row.image_url;
    }

    return {
        isValid: errors.length === 0,
        data: data,
        errors: errors,
    };
};

/**
 * Validate and format option
 */
const validateOption = (text, isCorrect) => {
    if (!text) return null;

    return {
        option_text: text,
        is_correct: parseBoolean(isCorrect),
    };
};

/**
 * Parse boolean string
 */
const parseBoolean = (val) => {
    if (!val) return false;
    val = val.toLowerCase();
    return val === 'true' || val === '1' || val === 'yes';
};

/**
 * Verify categories exist in database
 * @param {Array} rows - Parsed valid rows
 * @returns {Promise<Object>} - { validRows: [], invalidRows: [] }
 */
const verifyCategories = async (rows) => {
    // Categories are no longer used, so all rows are valid in terms of category
    return { validRows: rows, invalidRows: [] };
};

module.exports = {
    parseQuestionCSV,
    verifyCategories,
};
