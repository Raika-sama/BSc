// src/engines/CSI/routes/csi.routes.js
const express = require('express');
const logger = require('../../../utils/errors/logger/logger');

const createCSIRoutes = ({ authMiddleware, csiController }) => {
    if (!authMiddleware) throw new Error('authMiddleware is required');
    if (!csiController) throw new Error('csiController is required');

    const { protect } = authMiddleware;
    
    // Router per le route pubbliche (accesso via token)
    const publicRouter = express.Router();

    // Router per le route protette (accesso admin/insegnanti)
    const protectedRouter = express.Router();

    // Middleware di protezione per tutte le route protette
    protectedRouter.use(protect);

    // PUBLIC ROUTES (accesso via token)
    publicRouter.get('/verify/:token', csiController.verifyTestToken);
    publicRouter.post('/start/:token', csiController.startTestWithToken);
    publicRouter.post('/:token/answer', csiController.submitAnswer);
    publicRouter.post('/:token/complete', csiController.completeTest);

    // PROTECTED ROUTES (richiede autenticazione)
    protectedRouter.post('/generate-link', csiController.generateTestLink);
    protectedRouter.get('/stats/class/:classId', csiController.getClassStats);
    protectedRouter.get('/stats/school/:schoolId', csiController.getSchoolStats);
    protectedRouter.get('/results/student/:studentId', csiController.getStudentResults);
    protectedRouter.get('/:testId/result', csiController.getResult);
    protectedRouter.post('/:testId/report', csiController.generatePDFReport);
    protectedRouter.get('/validate/:testId', csiController.validateTestAvailability);
    protectedRouter.get('/:testId', csiController.getById);
    protectedRouter.get('/', csiController.getAll);
    protectedRouter.post('/init', csiController.initTest);

    // Gestione errori
    const errorHandler = (err, req, res, next) => {
        logger.error('CSI route error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });

        res.status(err.statusCode || 500).json({
            status: 'error',
            error: {
                message: err.message,
                code: err.code || 'INTERNAL_SERVER_ERROR'
            }
        });
    };

    publicRouter.use(errorHandler);
    protectedRouter.use(errorHandler);

    return {
        publicRoutes: publicRouter,
        protectedRoutes: protectedRouter
    };
};

module.exports = createCSIRoutes;