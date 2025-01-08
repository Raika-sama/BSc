BSc/
├── src/
│    ├── adminInterface/
│    │    ├── public/
│    │    │   ├── index.html
│    │    │   └── favicon.ico
│    │    ├── src/
│    │    │   ├── components/
│    │    │   │   ├── common/
│    │    │   │   │   ├── SearchInput.js
│    │    │   │   │   ├── LoadingSpinner.js
│    │    │   │   │   └── ConfirmDialog.js
│    │    │   │   ├── users/
│    │    │   │   │   ├── UserManagement.js
│    │    │   │   │   ├── UserForm.js
│    │    │   │   │   └── UsersList.js
│    │    │   │   └── schools/
│    │    │   │       ├── SchoolManagement.js
│    │    │   │       ├── SchoolForm.js
│    │    │   │       └── SchoolsList.js
│    │    │   ├── contexts/
│    │    │   │   ├── UserContext.js
│    │    │   │   ├── SchoolContext.js
│    │    │   │   └── NotificationContext.js
│    │    │   ├── services/
│    │    │   │   ├── api.js
│    │    │   │   ├── userService.js
│    │    │   │   └── schoolService.js
│    │    │   ├── utils/
│    │    │   │   ├── constants.js
│    │    │   │   └── validation.js
│    │    │   ├── App.js
│    │    │   ├── index.js
│    │    │   └── theme.js
│    │    ├── package.json
│    │    └── README.md
│    ├── config/                   # Backend Configuration
│    │   ├── config.js
│    │   ├── database.js
│    │   └── logger.config.js
│    ├── controllers/              # API Controllers
│    │   ├── userController.js
│    │   └── schoolController.js
│    ├── middleware/               # Express Middleware
│    │   ├── auth.js
│    │   └── errorHandler.js
│    ├── models/                   # MongoDB Models
│    │   ├── User.js
│    │   └── School.js
│    ├── routes/                   # API Routes
│    │   ├── userRoutes.js
│    │   └── schoolRoutes.js
│    ├── services/                 # Business Logic
│    │   ├── userService.js
│    │   └── schoolService.js
│    └── app.js                    # Main Express App
│    ├── tests/                        # Test Files
│    ├── unit/
│    └── integration/
├── logs/                         # Application Logs
├── docs/                         # Documentation
├── .env.development
├── .env.production
├── .env.test
├── package.json
└── README.md