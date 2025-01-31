/**
 * @file authRoutes.js
 * @description Router per la gestione dell'autenticazione
 * @author Raika-sama
 * @date 2025-01-31 22:05:42
 */

const express = require('express');
const router = express.Router();
const { auth: authController } = require('../controllers');
const { protect, loginLimiter } = require('../middleware/authMiddleware');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

/**
 * Wrapper per gestione errori asincrona
 */
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

// 1. Middleware di logging per tutte le route di auth
router.use((req, res, next) => {
    logger.info('Auth Route Called:', {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });
    next();
});

// 2. Route pubbliche (non protette)
//router.post('/register', 
//    asyncHandler(authController.register.bind(authController))
//);

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

// 3. Verifica token
router.get('/verify', 
    protect, 
    asyncHandler(async (req, res) => {
        logger.info('Token verification:', { userId: req.user._id });

        res.status(200).json({
            status: 'success',
            data: {
                valid: true,
                user: {
                    id: req.user._id,
                    schoolId: req.user.schoolId || null,
                    role: req.user.role,
                    tokenExpiresAt: new Date(req.user.tokenExp * 1000).toISOString()
                }
            }
        });
    })
);

// 4. Route protette (richiedono autenticazione)
router.use(protect);

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

// 5. Gestione errori centralizzata
router.use((err, req, res, next) => {
    logger.error('Auth Error:', {
        error: err,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    if (err.code && err.status) {
        // Errori già formattati
        return res.status(err.status).json({
            status: 'error',
            code: err.code,
            message: err.message
        });
    }

    // Converti in errore standard
    const standardError = createError(
        ErrorTypes.SYSTEM.INTERNAL_ERROR,
        'Errore interno del server di autenticazione',
        { originalError: err.message }
    );

    res.status(standardError.status).json({
        status: 'error',
        code: standardError.code,
        message: standardError.message,
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            originalError: err.message 
        })
    });
});

module.exports = router;

/**
 * @summary Documentazione delle Route
 * 
 * Route Pubbliche:
 * POST   /auth/register          - Registrazione nuovo utente
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