/**
 * @file testRoutes.js
 * @description Router per la gestione dei test
 * @author Raika-sama
 * @date 2025-02-16 17:17:28
 */

const express = require('express');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const mongoose = require('mongoose'); // Add this import

const createTestRouter = ({ authMiddleware, testController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!testController) throw new Error('TestController is required');

    const router = express.Router();
    const { protect, protectStudent, restrictTo, hasPermission, hasTestAccess } = authMiddleware;

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

    // Enhanced debugging middleware for model registration issues
    router.use((req, res, next) => {
        // Log detailed info about models when any test route is accessed
        const registeredModels = mongoose.modelNames();
        const resultModelInfo = mongoose.models.Result ? {
            name: mongoose.models.Result.modelName,
            hasDiscriminators: !!mongoose.models.Result.discriminators,
            discriminators: mongoose.models.Result.discriminators ? 
                Object.keys(mongoose.models.Result.discriminators) : [],
            collection: mongoose.models.Result.collection?.name
        } : 'Not registered';

        logger.debug('Test Route Model Debug Info:', {
            method: req.method,
            path: req.path,
            registeredModels,
            resultModel: resultModelInfo,
            userModel: mongoose.models.User ? {
                name: mongoose.models.User.modelName,
                collection: mongoose.models.User.collection?.name
            } : 'Not registered',
            testModel: mongoose.models.Test ? {
                name: mongoose.models.Test.modelName,
                collection: mongoose.models.Test.collection?.name,
                schema: !!mongoose.models.Test.schema
            } : 'Not registered',
            repositoryCheck: testController.repository ? {
                hasRepository: true,
                modelName: testController.repository.model?.modelName,
                hasModel: !!testController.repository.model
            } : {
                hasRepository: false
            },
            timestamp: new Date().toISOString()
        });

        next();
    });

    // Add debugging middleware specifically for the problematic route
    router.get('/assigned/student/:studentId', (req, res, next) => {
        logger.debug('Detailed debug for getAssignedTests route:', {
            studentId: req.params.studentId,
            testController: {
                hasRepository: !!testController.repository,
                repositoryType: testController.repository ? 
                    testController.repository.constructor.name : 'undefined',
                methodExists: typeof testController.getAssignedTests === 'function'
            },
            repositoryModel: testController.repository?.model ? {
                name: testController.repository.model.modelName,
                schema: !!testController.repository.model.schema,
                base: !!testController.repository.model.base
            } : 'No model'
        });
        next();
    }, 
    protect, 
    hasPermission('tests', 'read'),
    hasPermission('students', 'read'),
    asyncHandler(testController.getAssignedTests.bind(testController)));

    // Aggiungi la rotta per i test completati
    router.get('/student/:studentId/completed',
        protect,
        hasPermission('tests', 'read'),
        hasPermission('students', 'read'),
        asyncHandler(testController.getCompletedTests.bind(testController))
    );

    // Original middleware for general logging
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

    // Route che richiedono autenticazione
    router.get('/all',
        protect,
        hasPermission('tests', 'read'),
        asyncHandler(testController.getAll.bind(testController))
    );

    router.post('/assign',
        protect,
        hasPermission('tests', 'update'),
        hasPermission('students', 'update'),
        asyncHandler(testController.assignTest.bind(testController))
    );

    // Nuove route per la gestione dei test a livello di classe
    router.post('/assign-to-class',
        protect,
        hasPermission('tests', 'update'),
        hasPermission('classes', 'read'),
        asyncHandler(testController.assignTestToClass.bind(testController))
    );

    router.get('/assigned/class/:classId',
        protect,
        hasPermission('tests', 'read'),
        hasPermission('classes', 'read'),
        asyncHandler(testController.getAssignedTestsByClass.bind(testController))
    );

    router.post('/class/:classId/revoke',
        protect,
        hasPermission('tests', 'update'),
        hasPermission('classes', 'read'),
        asyncHandler(testController.revokeClassTests.bind(testController))
    );

    // Nuova route per revocare un test
    // Il middleware hasTestAccess è cruciale qui per garantire che l'utente possa accedere al test
    router.post('/:testId/revoke',
        protect,
        hasPermission('tests', 'update'),
        hasTestAccess(),
        asyncHandler(testController.revokeTest.bind(testController))
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
            hasPermission('tests', 'read'),
            hasTestAccess(), // Questo middleware verifica se l'utente può accedere al test
            asyncHandler(testController.getById.bind(testController))
        );

    router.get('/:testId/stats',
        protect,
        hasPermission('tests', 'read'),
        hasPermission('analytics', 'read'),
        hasTestAccess(),
        asyncHandler(testController.getTestStats.bind(testController))
    );

    router.get('/:testId/with-results', 
        protect,
        hasPermission('tests', 'read'),
        asyncHandler(testController.getTestWithResults.bind(testController))
    );
    
    router.get('/:testId/results', 
        protect,
        hasPermission('tests', 'read'),
        asyncHandler(testController.getTestResults.bind(testController))
    );
    
    /**  Rotte per modificare configurazione dei test (solo admin/developer)
    router.post('/configure', 
        protect,
        hasPermission('tests', 'manage'),
        asyncHandler(testController.configureTest.bind(testController))
    );
    
    router.put('/:testId/questions',
        protect,
        hasPermission('tests', 'manage'),
        asyncHandler(testController.updateQuestions.bind(testController))
    ); */
    
    router.post('/:testId/submit',
        protectStudent,
        asyncHandler(testController.submitTest.bind(testController))
    );

    // Gestione errori centralizzata
    router.use((err, req, res, next) => {
        // Enhanced error logging for model registration errors
        if (err.message && err.message.includes("Schema hasn't been registered for model")) {
            logger.error('Model Registration Error:', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method,
                registeredModels: mongoose.modelNames(),
                timestamp: new Date().toISOString(),
                controllerStatus: {
                    hasRepository: !!testController.repository,
                    modelName: testController.repository?.model?.modelName 
                }
            });
        } else {
            logger.error('Test Route Error:', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method,
                userId: req.user?.id,
                testId: req.params.testId,
                timestamp: new Date().toISOString()
            });
        }

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