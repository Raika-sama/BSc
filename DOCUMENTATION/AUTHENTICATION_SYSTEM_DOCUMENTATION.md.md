# Authentication System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Regular User Authentication](#regular-user-authentication)
   - [Models](#user-auth-models)
   - [Services](#user-auth-services)
   - [Controllers](#user-auth-controllers)
   - [Repositories](#user-auth-repositories)
   - [Routes](#user-auth-routes)
4. [Student Authentication](#student-authentication)
   - [Models](#student-auth-models)
   - [Services](#student-auth-services)
   - [Controllers](#student-auth-controllers)
   - [Repositories](#student-auth-repositories)
   - [Routes](#student-auth-routes)
5. [Middleware](#middleware)
6. [Security Measures](#security-measures)
7. [Error Handling](#error-handling)
8. [Frontend Integration](#frontend-integration)
9. [Session Management](#session-management)
10. [API Reference](#api-reference)

## System Overview

The authentication system implements a comprehensive solution for managing user authentication, authorization, and session management in a web application focused on educational settings. It consists of two parallel authentication pathways:

1. **Regular User Authentication** - For administrators, managers, teachers, and other staff members.
2. **Student Authentication** - A simplified authentication flow specifically designed for student users.

The system leverages JSON Web Tokens (JWT) with a dual-token approach (access + refresh tokens), industry-standard password hashing with bcrypt, and implements various security measures like rate limiting, account locking after failed attempts, and secure password reset flows.

Key features include:

- Token-based authentication with JWT
- Role-based access control (RBAC)
- Permission-based authorization
- Secure password storage with bcrypt
- Password reset functionality
- Session management with multiple device support
- Rate limiting for login attempts
- Account locking after failed login attempts
- First-access workflows for students
- Comprehensive error handling and logging

## Architecture

The authentication system follows a layered architecture with clear separation of concerns:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Routes   │────▶│ Controllers │────▶│  Services   │────▶│Repositories │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                  │                   │
       ▼                   ▼                  ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Middleware │     │Error Handling│     │Session Mgmt │     │   Models    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

- **Routes**: Define API endpoints and attach controllers and middleware
- **Controllers**: Handle HTTP requests/responses and delegate business logic to services
- **Services**: Implement business logic and interact with repositories
- **Repositories**: Handle data access and persistence operations
- **Models**: Define data schemas and validate data
- **Middleware**: Implement cross-cutting concerns like authentication, authorization, and validation

## Regular User Authentication

### User Auth Models

The primary model for user authentication is defined in a Mongoose schema (not directly visible in the shared files but referenced throughout). The model likely includes:

```javascript
// Inferred User Model Structure
{
  email: String,              // User's email, used as username
  password: String,           // Hashed password
  role: String,               // User role (admin, manager, teacher, etc.)
  schoolId: ObjectId,         // Reference to associated school
  permissions: [String],      // Array of permission strings
  loginAttempts: Number,      // Count of failed login attempts
  lockUntil: Date,            // Timestamp until account is locked
  lastLogin: Date,            // Timestamp of last successful login
  passwordHistory: [{         // History of previous passwords
    password: String,
    changedAt: Date
  }],
  sessionTokens: [{           // Active user sessions
    token: String,
    userAgent: String,
    ipAddress: String,
    expiresAt: Date,
    lastUsed: Date
  }],
  passwordResetToken: String, // Token for password reset
  passwordResetExpires: Date  // Expiration of password reset token
}
```

### User Auth Services

The `AuthService` class in `src/services/AuthService.js` encapsulates the core authentication business logic:

#### Key Methods:

##### `generateTokens(user, sessionToken)`
Generates JWT access and refresh tokens for a user.
- **Parameters**:
  - `user`: User object with id, role, and other properties
  - `sessionToken`: Unique session identifier
- **Returns**: Object containing access token and refresh token
- **Security**: Uses separate secrets and expiration times for access and refresh tokens

##### `refreshTokens(refreshToken)`
Validates a refresh token and issues new tokens.
- **Parameters**:
  - `refreshToken`: The refresh token string
- **Returns**: New access and refresh tokens along with user data
- **Security**: Verifies token validity, user existence, and session validity

##### `verifyToken(token)`
Verifies a JWT token's validity.
- **Parameters**:
  - `token`: JWT token string
- **Returns**: Decoded token payload or throws error
- **Security**: Checks token blacklist and validates signature

##### `login(email, password, metadata)`
Authenticates a user and creates a session.
- **Parameters**:
  - `email`: User's email
  - `password`: User's password
  - `metadata`: Additional info (IP, user agent)
- **Returns**: User data and tokens
- **Security**: Handles failed login attempts and account locking

##### `updatePassword(userId, currentPassword, newPassword)`
Updates a user's password.
- **Parameters**:
  - `userId`: User's ID
  - `currentPassword`: Current password
  - `newPassword`: New password
- **Security**: Verifies current password, maintains password history

##### `logout(refreshToken)`
Logs out a user by invalidating their refresh token.
- **Parameters**:
  - `refreshToken`: The refresh token to invalidate
- **Security**: Adds token to blacklist and removes session

### User Auth Controllers

The `AuthController` in `src/controllers/authController.js` handles HTTP requests and responses for authentication operations:

#### Key Methods:

##### `login(req, res, next)`
Handles user login requests.
- **Route**: POST /auth/login
- **Body**: `email`, `password`
- **Returns**: User data and access token
- **Security**: Sets HTTP-only cookies for tokens

##### `logout(req, res)`
Handles user logout requests.
- **Route**: POST /auth/logout
- **Security**: Removes tokens and clears cookies

##### `refreshToken(req, res)`
Refreshes the access token using a refresh token.
- **Route**: POST /auth/refresh-token
- **Returns**: New access token and user data

##### `getMe(req, res)`
Retrieves the authenticated user's profile.
- **Route**: GET /auth/me
- **Returns**: User data and active sessions

##### `forgotPassword(req, res)`
Initiates password reset process.
- **Route**: POST /auth/forgot-password
- **Body**: `email`
- **Security**: Sends reset token via email

##### `resetPassword(req, res)`
Resets a user's password with a valid token.
- **Route**: PUT /auth/reset-password/:token
- **Body**: `password`

##### `updatePassword(req, res)`
Updates authenticated user's password.
- **Route**: PUT /auth/update-password
- **Body**: `currentPassword`, `newPassword`
- **Security**: Invalidates all sessions after password change

### User Auth Repositories

The `AuthRepository` in `src/repositories/authRepository.js` handles data access operations for authentication:

#### Key Methods:

##### `findByEmail(email)`
Retrieves a user by email address.

##### `findById(userId)`
Retrieves a user by ID.

##### `updateLoginInfo(userId)`
Updates login-related information after successful login.

##### `incrementLoginAttempts(userId, maxAttempts, lockTime)`
Increases failed login attempt count and locks account if needed.

##### `updatePassword(userId, hashedPassword)`
Updates a user's password and maintains password history.

##### `verifyCredentials(email, password)`
Validates user login credentials.

##### `createPasswordResetToken(email)`
Generates a password reset token.

##### `verifyResetToken(token)`
Validates a password reset token.

##### `resetPassword(token, newPassword)`
Updates password using reset token.

### User Auth Routes

The authentication routes are defined in `src/routes/authRoutes.js`:

#### Public Routes:
```
POST   /auth/login            - Login user
POST   /auth/forgot-password  - Request password reset
PUT    /auth/reset-password   - Reset password with token
GET    /auth/verify           - Verify token
```

#### Protected Routes (require authentication):
```
GET    /auth/me               - Get current user profile
POST   /auth/refresh-token    - Refresh authentication token
PUT    /auth/update-password  - Update password
POST   /auth/logout           - Logout user
```

## Student Authentication

The student authentication system parallels the regular authentication system but with simplified flows designed specifically for students.

### Student Auth Models

The `StudentAuth` model in `src/models/StudentAuth.js` defines the schema for student authentication data:

```javascript
{
  studentId: ObjectId,        // Reference to student record
  username: String,           // Student's username (email)
  password: String,           // Hashed password
  isFirstAccess: Boolean,     // Whether first login has occurred
  isActive: Boolean,          // Whether account is active
  temporaryPassword: String,  // Temporary password for first access
  temporaryPasswordExpires: Date, // Expiration for temporary password
  lastLogin: Date,            // Last login timestamp
  loginAttempts: Number,      // Failed login attempts
  lockUntil: Date,            // Account lock expiration
  passwordResetToken: String, // Password reset token
  passwordResetExpires: Date, // Reset token expiration
  currentSession: {           // Current active session
    token: String,
    createdAt: Date,
    expiresAt: Date,
    deviceInfo: {
      userAgent: String,
      ipAddress: String
    }
  }
}
```

#### Key Methods:

##### `comparePassword(candidatePassword)`
Compares provided password with stored password.
- **Parameters**:
  - `candidatePassword`: Password to check
- **Returns**: Boolean indicating match
- **Security**: Handles both normal and temporary password comparison

##### `isLocked()`
Checks if account is currently locked.
- **Returns**: Boolean indicating if account is locked

##### `generateTemporaryPassword()`
Creates a new temporary password.
- **Returns**: Generated temporary password
- **Security**: Sets 24-hour expiration for temporary password

### Student Auth Services

The `StudentAuthService` in `src/services/StudentAuthService.js` handles authentication logic for students:

#### Key Methods:

##### `generateCredentials(studentId)`
Generates login credentials for a student.
- **Parameters**:
  - `studentId`: Student's ID
- **Returns**: Username and temporary password
- **Security**: Uses randomly generated temporary passwords

##### `resetPassword(studentId)`
Resets a student's password.
- **Parameters**:
  - `studentId`: Student's ID
- **Returns**: New temporary password and username

##### `generateBatchCredentials(studentIds)`
Generates credentials for multiple students.
- **Parameters**:
  - `studentIds`: Array of student IDs
- **Returns**: Success/failure report for each student
- **Security**: Email notifications for credentials

##### `generateCredentialsForClass(classId)`
Generates credentials for all students in a class.
- **Parameters**:
  - `classId`: Class ID
- **Returns**: Batch processing results
- **Security**: Only generates for students without credentials

##### `login(username, password, metadata)`
Authenticates a student.
- **Parameters**:
  - `username`: Student's username
  - `password`: Student's password
  - `metadata`: Device info
- **Returns**: Token and student data
- **Security**: Special handling for first access

##### `handleFirstAccess(studentId, temporaryPassword, newPassword)`
Handles first login password change.
- **Parameters**:
  - `studentId`: Student's ID
  - `temporaryPassword`: Temporary password
  - `newPassword`: New password chosen by student
- **Returns**: New session token
- **Security**: Validates temporary password

### Student Auth Routes

Student authentication routes are defined in `src/routes/studentAuthRoutes.js`:

#### Public Routes:
```
POST   /student-auth/login                    - Login student
```

#### Protected Student Routes:
```
POST   /student-auth/student/first-access/:id - First access and password change
POST   /student-auth/student/logout           - Logout student
```

#### Protected Admin Routes:
```
POST   /student-auth/admin/generate/:id       - Generate credentials for a student
POST   /student-auth/admin/generate-batch     - Generate credentials for multiple students
POST   /student-auth/admin/generate-class/:id - Generate credentials for a class
POST   /student-auth/admin/reset-password/:id - Reset student password
```

## Middleware

The authentication system includes several middleware components for request processing:

### Auth Middleware

Defined in `src/middleware/authMiddleware.js`, this provides:

#### Rate Limiting

```javascript
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit of 10 attempts
    // ...
});

const studentLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // stricter limit for students
    // ...
});
```

#### Authentication Middleware

##### `protect`
Middleware that verifies user authentication.
- Extracts token from request
- Verifies token validity
- Attaches user object to request
- Handles authentication errors

##### `protectStudent`
Similar to `protect` but for student authentication.

#### Authorization Middleware

##### `restrictTo(...roles)`
Restricts access to specific user roles.
- **Parameters**:
  - `roles`: Array of allowed roles
- **Security**: Denies access if user role is not included

##### `hasPermission(resource, action)`
Checks if user has required permissions.
- **Parameters**:
  - `resource`: Resource being accessed
  - `action`: Action being performed
- **Security**: Context-aware permission checks

##### `hasTestAccess()`
Specialized middleware for test resource access.

### Student Validation Middleware

Defined in `src/middleware/studentValidation.js`, this provides:

#### Validation Methods

##### `validateCreate`
Validates student creation data.
- Checks required fields
- Validates email formats
- Validates dates and IDs

##### `validateUpdate`
Validates student update data.

##### `validateClassAssignment`
Validates class assignment parameters.

##### `validateSearch`
Validates search parameters.

##### `validateBatchAssignment`
Validates batch class assignment.

## Security Measures

The authentication system implements multiple security measures:

### Password Security
- Passwords are hashed using bcrypt with 10 rounds of salting
- Password history is maintained to prevent reuse
- Password requirements (not explicitly defined in code)
- Temporary passwords expire after 24 hours

### Token Security
- Short-lived access tokens (1 hour by default)
- Longer-lived refresh tokens (7 days by default)
- HTTP-only cookies with secure and SameSite attributes
- Token blacklisting for revoked tokens
- Session tokens linked to specific devices

### Login Security
- Rate limiting to prevent brute force attacks
- Account locking after multiple failed attempts
- IP and user agent logging
- Comprehensive security logging

### Session Management
- Multiple device sessions supported
- Sessions can be individually terminated
- All sessions invalidated on password change
- Session expiration
- Last used tracking

## Error Handling

The system implements centralized error handling:

### Error Types

The system defines standard error types for consistent error responses:

```javascript
// Inferred from usage in code
ErrorTypes = {
  AUTH: {
    NO_TOKEN: {...},
    INVALID_TOKEN: {...},
    TOKEN_EXPIRED: {...},
    TOKEN_BLACKLISTED: {...},
    INVALID_CREDENTIALS: {...},
    USER_NOT_FOUND: {...},
    UNAUTHORIZED: {...},
    FORBIDDEN: {...},
    ACCOUNT_LOCKED: {...},
    SESSION_EXPIRED: {...},
    INVALID_SESSION: {...},
    TOKEN_GENERATION_FAILED: {...},
    NO_USER: {...}
  },
  VALIDATION: {
    BAD_REQUEST: {...},
    MISSING_FIELDS: {...}
  },
  RESOURCE: {
    NOT_FOUND: {...}
  },
  SYSTEM: {
    INTERNAL_ERROR: {...},
    OPERATION_FAILED: {...}
  }
}
```

### Error Creation

Errors are created with a standardized structure:

```javascript
const createError = (errorType, message, details) => {
  return {
    code: errorType.code,
    status: errorType.status,
    message: message || errorType.defaultMessage,
    details
  };
};
```

### Error Logging

The system includes comprehensive error logging:

```javascript
logger.error('Authentication failed', {
  error,
  path: req.path,
  ip: req.ip
});
```

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found"
  }
}
```

## Frontend Integration

The authentication system is designed to integrate with frontend applications using React context for state management.

### Auth Context

Defined in `src/adminInterface/src/context/AuthContext.js`, this provides:

```jsx
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [userStatus, setUserStatus] = useState(null);

  // Methods for login, logout, etc.

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    permissions,
    login,
    logout,
    updateUser,
    checkPermission,
    isAccountActive,
    userStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Auth Service (Frontend)

Defined in `src/adminInterface/src/services/authService.js`, this provides:

```javascript
const authService = {
  login: async (email, password) => { /* ... */ },
  logout: async () => { /* ... */ },
  getCurrentUser: () => { /* ... */ },
  updateUserData: (userData) => { /* ... */ },
  verifySession: async () => { /* ... */ },
  handleAuthError: async (error) => { /* ... */ }
};
```

## Session Management

The authentication system supports multi-device login with session tracking:

### Session Creation

Sessions are created during login:

```javascript
const sessionToken = jwt.sign(
  { 
    userId: user._id,
    createdAt: Date.now(),
    userAgent: metadata.userAgent
  }, 
  this.JWT_SECRET
);

await this.sessionService.createSession(user, sessionToken, {
  userAgent: metadata.userAgent,
  ipAddress: metadata.ipAddress,
  expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
  token: sessionToken
});
```

### Session Storage

Sessions are stored in the user document:

```javascript
// Inferred from usage
user.sessionTokens.push({
  token: sessionToken,
  userAgent: metadata.userAgent,
  ipAddress: metadata.ipAddress,
  expiresAt: new Date(Date.now() + ms(expiresIn)),
  lastUsed: new Date()
});
```

### Session Validation

Sessions are validated during token refresh:

```javascript
const session = user.sessionTokens?.find(s => s.token === decoded.sessionId);
if (!session) {
  throw createError(
    ErrorTypes.AUTH.INVALID_SESSION,
    'Session not found'
  );
}

if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
  await this.sessionService.removeSession(user._id, decoded.sessionId);
  throw createError(
    ErrorTypes.AUTH.SESSION_EXPIRED,
    'Session expired'
  );
}
```

## API Reference

### Regular User Authentication

#### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "userPassword"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "userId",
        "email": "user@example.com",
        "role": "admin",
        "schoolId": "schoolId",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Responses**:
  - 400 Bad Request: Missing email or password
  - 401 Unauthorized: Invalid credentials
  - 423 Locked: Account locked due to too many attempts
  - 429 Too Many Requests: Rate limit exceeded

#### Verify Token
- **URL**: `/auth/verify`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "valid": true,
      "user": {
        "id": "userId",
        "schoolId": "schoolId",
        "role": "admin",
        "tokenExpiresAt": "2023-01-01T01:00:00.000Z"
      }
    }
  }
  ```

#### Get Current User
- **URL**: `/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "userId",
        "email": "user@example.com",
        "role": "admin",
        "schoolId": "schoolId",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      },
      "sessions": {
        "active": 2,
        "current": "sessionId"
      }
    }
  }
  ```

#### Refresh Token
- **URL**: `/auth/refresh-token`
- **Method**: `POST`
- **Cookies**: `refresh-token: <refreshToken>`
- **Success Response**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "userId",
        "email": "user@example.com",
        "role": "admin",
        "schoolId": "schoolId"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### Logout
- **URL**: `/auth/logout`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Logout effettuato con successo"
  }
  ```

#### Forgot Password
- **URL**: `/auth/forgot-password`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Email di reset inviata con successo"
  }
  ```

#### Reset Password
- **URL**: `/auth/reset-password/:token`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "password": "newPassword"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Password aggiornata con successo"
  }
  ```

#### Update Password
- **URL**: `/auth/update-password`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "currentPassword": "currentPassword",
    "newPassword": "newPassword"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Password aggiornata con successo. Effettua nuovamente il login."
  }
  ```

### Student Authentication

#### Student Login
- **URL**: `/student-auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "student@example.com",
    "password": "studentPassword"
  }
  ```
- **Success Response (First Access)**:
  ```json
  {
    "isFirstAccess": true,
    "studentId": "studentId",
    "message": "Richiesto cambio password"
  }
  ```
- **Success Response (Normal Login)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "student": {
      "id": "studentId",
      "firstName": "Student",
      "lastName": "Name",
      "schoolId": "schoolId"
    },
    "isFirstAccess": false
  }
  ```

#### First Access
- **URL**: `/student-auth/student/first-access/:studentId`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "temporaryPassword": "tempPassword",
    "newPassword": "newPassword"
  }
  ```
- **Success Response**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "student": {
      "id": "studentId",
      "firstName": "Student",
      "lastName": "Name",
      "schoolId": "schoolId"
    }
  }
  ```

#### Generate Student Credentials
- **URL**: `/student-auth/admin/generate/:studentId`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <adminToken>`
- **Success Response**:
  ```json
  {
    "username": "student@example.com",
    "temporaryPassword": "a1b2c3d4"
  }
  ```

#### Generate Batch Credentials
- **URL**: `/student-auth/admin/generate-batch`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <adminToken>`
- **Body**:
  ```json
  {
    "studentIds": ["id1", "id2", "id3"]
  }
  ```
- **Success Response**:
  ```json
  {
    "success": [
      {
        "studentId": "id1",
        "username": "student1@example.com"
      },
      {
        "studentId": "id2",
        "username": "student2@example.com"
      }
    ],
    "failed": [
      {
        "studentId": "id3",
        "error": "Student not found"
      }
    ]
  }
  ```

#### Generate Class Credentials
- **URL**: `/student-auth/admin/generate-class/:classId`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <adminToken>`
- **Success Response**: Same as batch credentials

#### Reset Student Password
- **URL**: `/student-auth/admin/reset-password/:studentId`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer <adminToken>`
- **Success Response**:
  ```json
  {
    "username": "student@example.com",
    "temporaryPassword": "e5f6g7h8"
  }
  ```

## Implementation Best Practices

The authentication system follows several best practices for security and maintainability:

### 1. Clear Separation of Concerns

The system strictly separates:
- **Routes**: HTTP endpoint definitions
- **Controllers**: Request/response handling
- **Services**: Business logic
- **Repositories**: Data access
- **Models**: Data schema and validation

### 2. Security First Approach

- HTTP-only cookies for tokens
- Token-based authentication
- JWT with appropriate expiration
- Password hashing with bcrypt
- Rate limiting
- Account locking
- Session management

### 3. Error Handling

- Standardized error types
- Descriptive error messages
- Appropriate HTTP status codes
- Error logging with context
- Production vs development error details

### 4. Logging

- Comprehensive debug logging
- Sensitive data masking
- Request context in logs
- Error details with stack traces
- Login attempt tracking

### 5. Validation

- Input validation at multiple levels
- Schema-based validation
- Custom validation middleware

## Extension Points

The authentication system can be extended in several ways:

### 1. Additional Authentication Methods

- OAuth 2.0 / OpenID Connect integration
- Social login providers
- Multi-factor authentication (MFA)
- SAML for enterprise integration

### 2. Enhanced Security

- CAPTCHA for login attempts
- IP-based restrictions
- Geolocation validation
- Device fingerprinting
- Anomaly detection

### 3. User Management

- Self-registration flows
- Email verification
- Account deactivation
- User preferences
- Profile management

## Conclusion

The authentication system provides a robust, secure, and extensible solution for managing user authentication in an educational application context. It handles both regular users (staff, administrators) and students with appropriate security measures and user experiences for each group.

The architecture follows modern best practices for web application security while maintaining clean separation of concerns and code organization. The comprehensive error handling and logging ensure that issues can be quickly identified and resolved.

By following the documentation in this file, development teams can understand, maintain, and extend the authentication system as needed.