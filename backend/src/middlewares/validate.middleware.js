/**
 * Validation Middleware
 * Handles express-validator results
 */

const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((err) => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value,
        }));

        return ApiResponse.validationError(res, formattedErrors);
    }

    next();
};

module.exports = validate;
