// src/engines/CSI/routes/csi.routes.js
const express = require('express');
const logger = require('../../../utils/errors/logger/logger');
const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');

const createCSIRoutes = ({ authMiddleware, csiController }) => {
    // Aggiungiamo log all'inizio
    logger.debug('Creating CSI routes with controller:', {
        hasCsiController: !!csiController,
        controllerType: csiController?.constructor?.name,
        hasRepository: !!csiController?.repository
    });
    // Validazione dipendenze
    if (!authMiddleware) throw new Error('authMiddleware is required');
    if (!csiController) throw new Error('csiController is required');

    const { protect } = authMiddleware;
    
    // Routers
    const publicRouter = express.Router();
    const protectedRouter = express.Router();

    // Middleware di validazione token
    const validateToken = (req, res, next) => {
        const { token } = req.params;
        if (!token) {
            return next(createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Token non fornito'
            ));
        }
        next();
    };

    // Middleware di validazione risposta
    const validateAnswer = (req, res, next) => {
        const { questionId, value, timeSpent } = req.body;
        
        if (!questionId || typeof value !== 'number' || !timeSpent) {
            return next(createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Dati risposta incompleti o non validi'
            ));
        }

        if (value < 1 || value > 5) {
            return next(createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Valore risposta non valido (deve essere tra 1 e 5)'
            ));
        }

        if (timeSpent < 0) {
            return next(createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Tempo risposta non valido'
            ));
        }

        next();
    };

    // Middleware di logging
    const logRequest = (req, res, next) => {
        logger.debug('CSI route request:', {
            path: req.path,
            method: req.method,
            params: req.params,
            query: req.query,
            body: req.body
        });
        next();
    };

    // Applica middleware di base
    publicRouter.use(logRequest);
    protectedRouter.use(protect, logRequest);

    // PUBLIC ROUTES (accesso via token)
    publicRouter.get('/verify/:token',
        validateToken,
        csiController.verifyTestToken
    );

    publicRouter.post('/:token/start',
        validateToken,
        csiController.startTestWithToken
    );

    publicRouter.post('/:token/answer',
        validateToken,
        validateAnswer,
        csiController.submitAnswer
    );

    publicRouter.post('/:token/complete',
        validateToken,
        csiController.completeTest
    );

    // PROTECTED ROUTES (richiede autenticazione)
    protectedRouter.post('/generate-link',
        express.json(),
        (req, res, next) => {
            const { studentId } = req.body;
            if (!studentId) {
                return next(createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'StudentId non fornito'
                ));
            }
            next();
        },
        csiController.generateTestLink
    );

    
// Rotte per la configurazione (protette)
protectedRouter.get('/config',
    csiController.getConfiguration  // il metodo che abbiamo aggiunto
);

protectedRouter.put('/config',
    express.json(),
    csiController.updateConfiguration  // il metodo che abbiamo aggiunto
);

    // Error handler migliorato
    const errorHandler = (err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
        
        logger.error('CSI route error:', {
            error: err.message,
            code: errorCode,
            stack: err.stack,
            path: req.path,
            method: req.method,
            params: req.params,
            body: req.body
        });

        const errorResponse = {
            status: 'error',
            error: {
                code: errorCode,
                message: err.message
            }
        };

        // Aggiungi dettagli extra solo in development
        if (process.env.NODE_ENV === 'development') {
            errorResponse.error.stack = err.stack;
            errorResponse.error.details = err.details;
        }

        res.status(statusCode).json(errorResponse);
    };

    // Applica error handler
    publicRouter.use(errorHandler);
    protectedRouter.use(errorHandler);

    return {
        publicRoutes: publicRouter,
        protectedRoutes: protectedRouter
    };
};

module.exports = createCSIRoutes;