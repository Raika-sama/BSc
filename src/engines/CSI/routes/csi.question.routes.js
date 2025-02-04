// csi.question.routes.js
const express = require('express');
const CSIQuestionValidator = require('../utils/CSIQuestionValidator');
const logger = require('../../../utils/errors/logger/logger');

const createQuestionRoutes = ({ authMiddleware, csiQuestionController }) => {
    if (!authMiddleware) throw new Error('authMiddleware is required');
    if (!csiQuestionController) throw new Error('csiQuestionController is required');

    logger.debug('Creating CSI question routes with controller:', {
        hasController: !!csiQuestionController,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(csiQuestionController))
    });

    const { protect, restrictTo } = authMiddleware;
    const router = express.Router();

    // Middleware di validazione
    const validateQuestionData = (req, res, next) => {
        try {
            CSIQuestionValidator.validate(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };

    // Routes con middleware di validazione aggiornati
    router.get('/', 
        protect, 
        csiQuestionController.getActiveQuestions.bind(csiQuestionController)
    );

    router.post('/', 
        protect, 
        restrictTo('admin', 'teacher'),
        validateQuestionData,
        csiQuestionController.createQuestion.bind(csiQuestionController)
    );
    
    router.put('/:id', 
        protect,
        restrictTo('admin', 'teacher'),
        validateQuestionData,
        csiQuestionController.updateQuestion.bind(csiQuestionController)
    );
    
    router.delete('/:id',
        protect,
        restrictTo('admin'),
        csiQuestionController.deleteQuestion.bind(csiQuestionController)
    );

    router.get('/metadata/tags',
        protect,
        csiQuestionController.getAvailableTags.bind(csiQuestionController)
    );

    router.patch('/:id/metadata',
        protect,
        restrictTo('admin', 'teacher'),
        csiQuestionController.updateMetadata.bind(csiQuestionController)
    );

    return router;
};

module.exports = createQuestionRoutes;