/**
 * File Upload Middleware
 * Handles file uploads using multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const ApiResponse = require('../utils/apiResponse');

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const tempDir = path.join(uploadDir, 'temp');
const questionsDir = path.join(uploadDir, 'questions');

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(tempDir);
fs.ensureDirSync(questionsDir);

/**
 * Configure storage
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = tempDir;

        // Determine destination based on file type or field name
        if (file.fieldname === 'image' || file.fieldname === 'images' || file.mimetype.startsWith('image/')) {
            dest = questionsDir;
        }

        cb(null, dest);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: uuid-timestamp.extension
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'file') {
        // CSV and Excel validation
        const allowedMimeTypes = [
            'text/csv',
            'application/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        const allowedExtensions = ['.csv', '.xls', '.xlsx'];

        if (
            allowedMimeTypes.includes(file.mimetype) ||
            allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'), false);
        }
    } else if (file.fieldname === 'image' || file.fieldname === 'images') {
        // Image validation
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    } else {
        cb(new Error('Unexpected field name'), false);
    }
};


/**
 * Multer instance
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

/**
 * Upload middleware wrapper to handle errors
 */
const handleUpload = (fieldName) => (req, res, next) => {
    const uploader = upload.single(fieldName);

    uploader(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer error (e.g., file too large)
            return ApiResponse.error(res, err.message, 400);
        } else if (err) {
            // Other errors (e.g., invalid file type)
            return ApiResponse.error(res, err.message, 400);
        }
        // No error, proceed
        next();
    });
};

module.exports = {
    uploadCSV: handleUpload('file'),
    uploadImage: handleUpload('image'),
    uploadImages: (req, res, next) => {
        const uploader = upload.array('images', 3);
        uploader(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return ApiResponse.error(res, err.message, 400);
            } else if (err) {
                return ApiResponse.error(res, err.message, 400);
            }
            next();
        });
    }
};
