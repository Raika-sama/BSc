// src/engines/CSI/routes/csi.question.routes.js

const express = require('express');
const CSIQuestionController = require('../CSIQuestionController');
const CSIQuestionService = require('../CSIQuestionService');
const CSIQuestionRepository = require('../CSIQuestionRepository');
const logger = require('../../../utils/errors/logger/logger');

const createQuestionRoutes = ({ authMiddleware }) => {
    if (!authMiddleware) throw new Error('authMiddleware is required');
    
    const { protect, restrictTo } = authMiddleware;
    const router = express.Router();

    // Inizializza le dipendenze
    const repository = new CSIQuestionRepository();
    const service = new CSIQuestionService(repository);
    const controller = new CSIQuestionController(service);

    // Middleware di logging
    router.use((req, res, next) => {
        logger.debug('CSI Question Route Called:', {
            method: req.method,
            path: req.path,
            body: req.body,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });
        next();
    });

    // Routes
    router.get('/', controller.getActiveQuestions.bind(controller));
    router.post('/', controller.createQuestion.bind(controller));
    router.put('/:id', controller.updateQuestion.bind(controller));
    router.delete('/:id', controller.deleteQuestion.bind(controller));
    router.get('/versions/stats', controller.getVersionStats.bind(controller));

    // Error handler
    router.use((err, req, res, next) => {
        logger.error('CSI Question Route Error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.user?.id
        });

        res.status(err.statusCode || 500).json({
            status: 'error',
            error: {
                message: err.message,
                code: err.code || 'CSI_QUESTION_ERROR'
            }
        });
    });

    return router;
};

module.exports = createQuestionRoutes;