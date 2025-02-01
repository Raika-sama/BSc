/**
 * @file testRoutes.js
 * @description Router per la gestione dei test
 * @author Raika-sama
 * @date 2025-02-01 10:23:21
 */

const express = require('express');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');

const createTestRouter = ({ authMiddleware, testController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!testController) throw new Error('TestController is required');

    const router = express.Router();
    const { protect, restrictTo } = authMiddleware;

    // Utility per gestione async
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            logger.error('Test Route Error:', {
                error: error.message,
                path: req.path,
                method: req.method,
                userId: req.user?.id,
                timestamp: new Date().toISOString()
            });
            next(error);
        });
    };

    // Middleware di logging
    router.use((req, res, next) => {
        logger.debug('Test Route Called:', {
            method: req.method,
            path: req.path,
            userId: req.user?.id,
            role: req.user?.role,
            timestamp: new Date().toISOString()
        });
        next();
    });

    // Middleware di protezione globale
    router.use(protect);

    // Route per la gestione dei test
    router.route('/')
        .get(
            restrictTo('teacher', 'admin'),
            asyncHandler(testController.getAll.bind(testController))
        )
        .post(
            restrictTo('student'),
            asyncHandler(testController.startTest.bind(testController))
        );

    router.route('/:id')
        .get(
            restrictTo('teacher', 'admin', 'student'),
            asyncHandler(testController.getById.bind(testController))
        );

    router.get('/:testId/stats',
        restrictTo('teacher', 'admin'),
        asyncHandler(testController.getTestStats.bind(testController))
    );

    router.post('/:testId/submit',
        restrictTo('student'),
        asyncHandler(testController.submitTest.bind(testController))
    );

    // Gestione errori centralizzata
    router.use((err, req, res, next) => {
        logger.error('Test Route Error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            testId: req.params.testId,
            timestamp: new Date().toISOString()
        });

        // Gestione errori di validazione
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                status: 'error',
                error: {
                    message: 'Errore di validazione',
                    code: 'TEST_VALIDATION_ERROR',
                    details: err.errors
                }
            });
        }

        // Gestione errori di autorizzazione
        if (err.code === 'AUTH_004' || err.statusCode === 401) {
            return res.status(401).json({
                status: 'error',
                error: {
                    message: 'Non autorizzato',
                    code: 'TEST_AUTH_ERROR'
                }
            });
        }

        // Altri errori
        const finalError = err.code ? err : createError(
            ErrorTypes.SYSTEM.GENERIC_ERROR,
            'Errore durante l\'elaborazione del test'
        );
        
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            status: 'error',
            error: {
                code: finalError.code,
                message: finalError.message,
                ...(process.env.NODE_ENV === 'development' && { 
                    stack: err.stack,
                    details: err.metadata 
                })
            }
        });
    });

    return router;
};

module.exports = createTestRouter;

/**
 * @summary Documentazione delle Route
 * 
 * Route Protette (richiede autenticazione):
 * GET    /tests                  - Lista tutti i test (teacher/admin)
 * GET    /tests/:id             - Dettaglio test (teacher/admin/student)
 * GET    /tests/:testId/stats   - Statistiche test (teacher/admin)
 * POST   /tests                 - Inizia un test (student)
 * POST   /tests/:testId/submit  - Invia risposte test (student)
 * 
 * Controllo Accessi:
 * - Admin: accesso completo visualizzazione
 * - Teacher: accesso completo visualizzazione
 * - Student: solo accesso al proprio test e invio risposte
 * - Altri: nessun accesso
 */