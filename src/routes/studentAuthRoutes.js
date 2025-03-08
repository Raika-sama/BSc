// src/routes/studentAuthRoutes.js
const express = require('express');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');
const StudentAuthController = require('../controllers/StudentAuthController');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const createStudentAuthRouter = ({ 
    authMiddleware, 
    studentAuthController 
}) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!studentAuthController) throw new Error('StudentAuthController is required');

    const router = express.Router();
    const { protect, protectStudent, restrictTo, loginLimiter } = authMiddleware;

    // Utility per gestione async
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            logger.error('StudentAuth Route Error:', {
                error: error.message,
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
            next(error);
        });
    };

    // Middleware di logging
    router.use((req, res, next) => {
        logger.debug('StudentAuth route called:', {
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
        next();
    });

    // Route pubbliche (accesso studenti)
    router.post('/login', 
        loginLimiter,
        asyncHandler(studentAuthController.login.bind(studentAuthController))
    );

    router.post('/logout',
        asyncHandler(studentAuthController.logout.bind(studentAuthController))
    );

    // Route protette per studenti
    router.use('/student', protectStudent);
    
    router.get('/student/profile',
        asyncHandler(studentAuthController.getProfile.bind(studentAuthController))
    );

    router.post('/student/first-access/:studentId',
        asyncHandler(studentAuthController.handleFirstAccess.bind(studentAuthController))
    );

    router.post('/student/logout',
        asyncHandler(studentAuthController.logout.bind(studentAuthController))
    );

    // Route protette per admin/manager
    router.use('/admin', protect, restrictTo('admin', 'manager'));

    router.post('/admin/generate/:studentId',
        asyncHandler(studentAuthController.generateCredentials.bind(studentAuthController))
    );

    router.post('/admin/generate-batch',
        asyncHandler(studentAuthController.generateBatchCredentials.bind(studentAuthController))
    );

    router.post('/admin/generate-class/:classId',
        asyncHandler(studentAuthController.generateClassCredentials.bind(studentAuthController))
    );

    router.post('/admin/reset-password/:studentId',
        asyncHandler(studentAuthController.resetPassword.bind(studentAuthController))
    );

    // Gestione errori centralizzata
    router.use((err, req, res, next) => {
        logger.error('StudentAuth error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        if (err.code && err.status) {
            return res.status(err.status).json({
                status: 'error',
                error: {
                    code: err.code,
                    message: err.message,
                    ...(err.details && { details: err.details })
                }
            });
        }

        const standardError = createError(
            ErrorTypes.SYSTEM.INTERNAL_ERROR,
            'Errore interno del server di autenticazione studenti'
        );

        res.status(standardError.status).json({
            status: 'error',
            error: {
                code: standardError.code,
                message: standardError.message,
                ...(process.env.NODE_ENV === 'development' && { 
                    stack: err.stack,
                    originalError: err.message 
                })
            }
        });
    });

    return router;
};

module.exports = createStudentAuthRouter;

/**
 * @summary Documentazione delle Route
 * 
 * Route Pubbliche (Studenti):
 * POST   /student-auth/login                    - Login studente
 * POST   /student-auth/logout                   - Logout studente
 * 
 * Route Protette (Studenti):
 * POST   /student-auth/student/first-access/:id - Primo accesso e cambio password
 * POST   /student-auth/student/logout           - Logout studente
 * 
 * Route Protette (Admin/Manager):
 * POST   /student-auth/admin/generate/:id       - Genera credenziali singolo studente
 * POST   /student-auth/admin/generate-batch     - Genera credenziali batch
 * POST   /student-auth/admin/generate-class/:id - Genera credenziali classe
 * POST   /student-auth/admin/reset-password/:id - Reset password studente
 */