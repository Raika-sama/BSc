// src/components/engines/CSI/routes/csi.question.routes.js

const express = require('express');
const CSIQuestionController = require('../CSIQuestionController');
const { protect, restrictTo } = require('../../../middleware/authMiddleware');

const router = express.Router();

// Aggiungiamo l'utility asyncHandler
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};


// Aggiungiamo logging middleware
router.use((req, res, next) => {
    logger.debug('CSI Question Route Called:', {
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
    });
    next();
});

router.route('/')
    .get(asyncHandler(CSIQuestionController.getActiveQuestions))
    .post(asyncHandler(CSIQuestionController.createQuestion));

router.route('/:id')
    .put(asyncHandler(CSIQuestionController.updateQuestion))
    .delete(asyncHandler(CSIQuestionController.deleteQuestion));

router.get('/versions/stats', asyncHandler(CSIQuestionController.getVersionStats));

// Aggiungiamo error handler
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

module.exports = router;