// src/routes/authRoutes.js
const express = require('express');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

const createAuthRouter = ({ authController, authMiddleware }) => {
    if (!authController) throw new Error('AuthController is required');
    if (!authMiddleware) throw new Error('AuthMiddleware is required');

    const router = express.Router();
    const { protect, loginLimiter } = authMiddleware;

    // Utility per gestione async
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            logger.error('Auth Route Error:', {
                error,
                path: req.originalUrl,
                method: req.method
            });
            next(error);
        });
    };

    // Middleware di logging per debugging
    router.use((req, res, next) => {
        logger.debug('Auth Route Called:', {
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        next();
    });

    // Route pubbliche
    router.post('/login', 
        loginLimiter,
        asyncHandler(authController.login.bind(authController))
    );

    router.post('/forgot-password', 
        asyncHandler(authController.forgotPassword.bind(authController))
    );

    router.put('/reset-password/:token', 
        asyncHandler(authController.resetPassword.bind(authController))
    );

    // Verifica token
    router.get('/verify', 
        protect,
        asyncHandler(async (req, res) => {
            logger.debug('Token verification requested', { 
                userId: req.user.id,
                path: req.path 
            });

            res.status(200).json({
                status: 'success',
                data: {
                    valid: true,
                    user: {
                        id: req.user.id,
                        schoolId: req.user.schoolId || null,
                        role: req.user.role,
                        tokenExpiresAt: req.user.tokenExp ? 
                            new Date(req.user.tokenExp * 1000).toISOString() : 
                            null
                    }
                }
            });
        })
    );

    // Middleware di protezione per tutte le route seguenti
    router.use(protect);

    // Route protette
    router.get('/me', 
        asyncHandler(authController.getMe.bind(authController))
    );

    router.post('/refresh-token',
        asyncHandler(authController.refreshToken.bind(authController))
    );

    router.put('/update-password', 
        asyncHandler(authController.updatePassword.bind(authController))
    );

    router.post('/logout', 
        asyncHandler(authController.logout.bind(authController))
    );

    // Gestione errori centralizzata
    router.use((err, req, res, next) => {
        logger.error('Auth Error:', {
            error: err,
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?.id
        });

        if (err.code && err.status) {
            return res.status(err.status).json({
                status: 'error',
                error: {
                    code: err.code,
                    message: err.message
                }
            });
        }

        const standardError = createError(
            ErrorTypes.SYSTEM.INTERNAL_ERROR,
            'Errore interno del server di autenticazione'
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

module.exports = createAuthRouter;

/**
 * @summary Documentazione delle Route
 * 
 * Route Pubbliche:
 * POST   /auth/login            - Login utente
 * POST   /auth/forgot-password  - Richiesta reset password
 * PUT    /auth/reset-password   - Reset password con token
 * GET    /auth/verify           - Verifica token
 * 
 * Route Protette:
 * GET    /auth/me               - Profilo utente corrente
 * POST   /auth/refresh-token    - Rinnovo token
 * PUT    /auth/update-password  - Aggiornamento password
 * POST   /auth/logout           - Logout utente
 */