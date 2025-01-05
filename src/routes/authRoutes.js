// src/routes/authRoutes.js

/**
 * @file authRoutes.js
 * @description Router per la gestione dell'autenticazione
 * @author Raika-sama
 * @date 2025-01-05
 */

const express = require('express');
const router = express.Router();
const { auth: authController } = require('../controllers');
const { protect } = require('../middleware/authMiddleware');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

/**
 * Middleware per il logging delle richieste di autenticazione
 */
router.use((req, res, next) => {
    const routeInfo = {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    };

    logger.info('Auth Route Called', routeInfo);
    next();
});

/**
 * Wrapper per gestione errori asincrona
 * @param {Function} fn - Function handler della route
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        logger.error('Route Error Handler', {
            error,
            path: req.originalUrl,
            method: req.method
        });
        next(error);
    });
};

// Routes pubbliche
router.post('/register', 
    asyncHandler(authController.register.bind(authController))
);

router.post('/login', 
    asyncHandler(authController.login.bind(authController))
);

router.post('/forgot-password', 
    asyncHandler(authController.forgotPassword.bind(authController))
);

router.put('/reset-password/:token', 
    asyncHandler(authController.resetPassword.bind(authController))
);

// Middleware di protezione per le route autenticate
router.use(protect);

// Routes protette
router.get('/me', 
    asyncHandler(authController.getMe.bind(authController))
);

router.put('/update-password', 
    asyncHandler(authController.updatePassword.bind(authController))
);

router.post('/logout', 
    asyncHandler(authController.logout.bind(authController))
);

// Error handler specifico per le route di autenticazione
router.use((err, req, res, next) => {
    if (err.code && err.status) {
        // Errori già formattati
        return res.status(err.status).json({
            status: 'error',
            code: err.code,
            message: err.message
        });
    }

    // Log errori non gestiti
    logger.error('Unhandled Auth Route Error', {
        error: err,
        path: req.originalUrl,
        method: req.method
    });

    // Converti in errore standard
    const standardError = createError(
        ErrorTypes.SYSTEM.INTERNAL_ERROR,
        'Errore interno del server di autenticazione',
        { originalError: err.message }
    );

    res.status(standardError.status).json({
        status: 'error',
        code: standardError.code,
        message: standardError.message
    });
});

module.exports = router;