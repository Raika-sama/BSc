/**
 * @file testRoutes.js
 * @description Router per la gestione dei test
 * @author Raika-sama
 * @date 2025-02-16 17:17:28
 */

const express = require('express');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');

const createTestRouter = ({ authMiddleware, testController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!testController) throw new Error('TestController is required');

    const router = express.Router();
    const { protect, protectStudent, restrictTo } = authMiddleware;

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

    // Route per test con token (non richiedono autenticazione)
    router.post('/start-token',
        asyncHandler(testController.startTest.bind(testController))
    );

    // Route che richiedono autenticazione docente/admin
    router.use(['/all', '/assign', '/:testId/stats'], protect);

    router.get('/all',
        restrictTo('teacher', 'admin'),
        asyncHandler(testController.getAll.bind(testController))
    );

    router.post('/assign',
        restrictTo('teacher', 'admin'),
        asyncHandler(testController.assignTest.bind(testController))
    );

    // Route che richiedono autenticazione studente
    router.get('/my-tests',
        protectStudent,
        asyncHandler(testController.getMyTests.bind(testController))
    );

    router.post('/start-assigned/:testId',
        protectStudent,
        asyncHandler(testController.startAssignedTest.bind(testController))
    );

    // Route comuni
    router.route('/:id')
        .get(
            protect,
            restrictTo('teacher', 'admin', 'student'),
            asyncHandler(testController.getById.bind(testController))
        );

    router.get('/:testId/stats',
        protect,
        restrictTo('teacher', 'admin'),
        asyncHandler(testController.getTestStats.bind(testController))
    );

    router.post('/:testId/submit',
        protectStudent,
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
 * Route Pubbliche (accesso con token):
 * POST   /tests/start-token         - Inizia test con token
 * 
 * Route Protette (richiede autenticazione docente/admin):
 * GET    /tests/all                 - Lista tutti i test
 * POST   /tests/assign              - Assegna test a studente
 * GET    /tests/:testId/stats       - Statistiche test
 * 
 * Route Protette (richiede autenticazione studente):
 * GET    /tests/my-tests           - Lista test assegnati
 * POST   /tests/start-assigned/:id  - Inizia test assegnato
 * POST   /tests/:testId/submit     - Invia risposte test
 * 
 * Route Protette (accesso misto):
 * GET    /tests/:id               - Dettaglio test (auth richiesta)
 * 
 * Controllo Accessi:
 * - Admin/Teacher: accesso completo gestione e visualizzazione
 * - Student: accesso ai propri test assegnati
 * - Token: accesso limitato al test specifico
 */