# Exam Portal Backend

A robust Node.js backend API for an online assessment platform with role-based access control, JWT authentication, and MySQL database.

## 🚀 Features

- **Express.js** - Fast, unopinionated web framework
- **MySQL + Sequelize** - Powerful ORM for database management
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Support for super_user, admin, and student roles
- **Environment-Based Configuration** - Flexible configuration management
- **Error Handling** - Centralized error handling middleware
- **Security** - Helmet.js for security headers, CORS support
- **Health Check API** - System monitoring endpoints

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── env.config.js    # Environment variables
│   │   └── database.config.js # Database connection
│   ├── controllers/         # Request handlers
│   │   └── health.controller.js
│   ├── middlewares/         # Custom middleware
│   │   ├── auth.middleware.js
│   │   └── errorHandler.js
│   ├── models/              # Sequelize models (to be added)
│   ├── routes/              # API routes
│   │   ├── index.js
│   │   └── health.routes.js
│   ├── utils/               # Utility functions
│   │   ├── apiResponse.js
│   │   └── jwt.util.js
│   ├── validators/          # Request validation (to be added)
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
├── .env.example             # Sample environment variables
├── .gitignore
└── package.json
```

## 🛠️ Installation

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- MySQL >= 5.7

### Steps

1. **Clone the repository** (or navigate to backend directory)
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the following:
   - `DB_HOST` - Your MySQL host
   - `DB_NAME` - Database name (e.g., exam_portal)
   - `DB_USER` - Database username
   - `DB_PASSWORD` - Database password
   - `JWT_SECRET` - Strong secret key for JWT
   - `JWT_REFRESH_SECRET` - Strong secret key for refresh tokens

4. **Create the database**
   ```sql
   CREATE DATABASE exam_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

5. **Run the database schema** (optional, if you have the schema.sql file)
   ```bash
   mysql -u root -p exam_portal < schema.sql
   ```

## 🚀 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT)

## 📡 API Endpoints

### Health Check Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/health` | Basic health check | Public |
| GET | `/api/v1/health/db` | Database health check | Public |
| GET | `/api/v1/health/status` | Detailed system status | Public |
| GET | `/api/v1` | API information | Public |

### Example Response

**GET** `/api/v1/health`
```json
{
  "success": true,
  "message": "Server is running",
  "data": {
    "status": "OK",
    "timestamp": "2026-01-26T12:27:00.000Z",
    "uptime": 123.456,
    "environment": "development"
  },
  "timestamp": "2026-01-26T12:27:00.000Z"
}
```

## 🔐 Authentication

The backend uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Middleware Usage

```javascript
const { authenticate, authorize } = require('./middlewares/auth.middleware');

// Protect route (requires authentication)
router.get('/protected', authenticate, controller.method);

// Protect route with role authorization
router.post('/admin-only', authenticate, authorize('admin', 'super_user'), controller.method);
```

## 🗄️ Database

The application uses Sequelize ORM with MySQL. Database configuration is in `src/config/database.config.js`.

### Connection Pool Settings
- Max connections: 5
- Min connections: 0
- Acquire timeout: 30 seconds
- Idle timeout: 10 seconds

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 5000 |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_NAME` | Database name | exam_portal |
| `DB_USER` | Database username | root |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | Access token expiry | 24h |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 7d |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | 10 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |

## 🛡️ Security Features

- **Helmet.js** - Sets security HTTP headers
- **CORS** - Configurable cross-origin resource sharing
- **JWT** - Secure token-based authentication
- **Bcrypt** - Password hashing with configurable salt rounds
- **Input Validation** - Express-validator ready for request validation

## 📝 Next Steps

1. **Implement Models** - Create Sequelize models for users, roles, exams, questions, etc.
2. **Add Business Logic** - Implement controllers for authentication, exams, questions
3. **Add Validation** - Create validators for request data
4. **Add Tests** - Write unit and integration tests
5. **Add Logging** - Implement proper logging (Winston, Morgan)
6. **Add Rate Limiting** - Implement rate limiting for API endpoints

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

ISC
