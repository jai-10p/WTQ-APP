/**
 * Environment Configuration
 * Loads and validates environment variables
 */

require('dotenv').config();

const config = {
    // Server Configuration
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    apiVersion: process.env.API_VERSION || 'v1',

    // Database Configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        name: process.env.DB_NAME || 'exam_portal',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        dialect: process.env.DB_DIALECT || 'mysql',
        pool: {
            max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
            min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
            acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
            idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // Bcrypt Configuration
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
    },

    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    },

    // File Upload
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
        uploadPath: process.env.UPLOAD_PATH || './uploads',
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};

// Validate required environment variables in production
if (config.env === 'production') {
    const requiredEnvVars = [
        'DB_HOST',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
    ];

    const missingEnvVars = requiredEnvVars.filter(
        (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingEnvVars.join(', ')}`
        );
    }
}

module.exports = config;
