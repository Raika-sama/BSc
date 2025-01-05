 Brain-Scanner API - Technical Documentation
Version: 1.0.0
Base URL: /api/v1

🔍 API Overview
Routes Structure
Code
/api/v1/
├── /health
├── /schools
├── /users
├── /classes
├── /students
└── /tests
📌 Detailed Endpoints
1️⃣ Schools API (/schools)
HTTP
GET    /schools            # List all schools
GET    /schools/:id        # Get school details
POST   /schools            # Create new school
PUT    /schools/:id        # Update school
DELETE /schools/:id        # Delete school
Authentication: Required except for GET

2️⃣ Users API (/users)
HTTP
# Public Routes
POST   /users/login           # User login
POST   /users/register        # User registration
POST   /users/forgot-password # Password reset request

# Protected Routes
GET    /users/me             # Get user profile
PUT    /users/update-password # Update password
Authentication: Required for protected routes

3️⃣ Classes API (/classes)
HTTP
GET    /classes              # List all classes
GET    /classes/:id          # Get class details
POST   /classes              # Create new class
PUT    /classes/:id          # Update class
DELETE /classes/:id          # Delete class
Authentication: Required

4️⃣ Students API (/students)
HTTP
GET    /students            # List all students
GET    /students/:id        # Get student details
POST   /students           # Create new student
PUT    /students/:id       # Update student
DELETE /students/:id       # Delete student
Authentication: Required

5️⃣ Tests API (/tests)
HTTP
GET    /tests              # List all tests
GET    /tests/:id          # Get test details
POST   /tests             # Create new test
GET    /tests/:id/results # Get test results
POST   /tests/:id/submit  # Submit test results
Authentication: Required

🔒 Authentication
Bearer Token required in header:
Authorization: Bearer <token>
📝 Response Format
JSON
{
    "status": "success|error",
    "data": {
        // Response data
    },
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description"
    }
}
🎯 HTTP Status Codes
Code
200 - OK (Success)
201 - Created
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 - Internal Server Error
🔄 Query Parameters
Common parameters available for list endpoints:

Code
?page=1           # Pagination page number
?limit=10         # Items per page
?sort=field       # Sort by field
?order=asc|desc   # Sort order
?search=term      # Search term
🚥 Rate Limiting
Code
Max requests: 100 per 15 minutes
Header: X-RateLimit-Remaining
🛠️ Error Handling
JSON
{
    "status": "error",
    "error": {
        "code": "ERROR_CODE",
        "message": "Detailed error message",
        "metadata": {
            // Additional error information
        }
    }
}
📦 Request Examples
Create School
HTTP
POST /api/v1/schools
Content-Type: application/json

{
    "name": "Test School",
    "schoolType": "high_school",
    "institutionType": "scientific",
    "sections": ["A", "B", "C"],
    "region": "Lombardia",
    "province": "Milano"
}
User Login
HTTP
POST /api/v1/users/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
