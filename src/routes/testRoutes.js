// src/routes/testRoutes.js
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/errors/logger/logger');

const createTestRouter = ({ testController }) => {
    const router = express.Router();

    // Middleware di protezione globale
    router.use(protect);

    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    router.get('/', asyncHandler(testController.getAll.bind(testController)));
    router.get('/:id', asyncHandler(testController.getById.bind(testController)));
    router.get('/:testId/stats', asyncHandler(testController.getTestStats.bind(testController)));
    router.post('/', asyncHandler(testController.startTest.bind(testController)));
    router.post('/:testId/submit', asyncHandler(testController.submitTest.bind(testController)));

    return router;
};

module.exports = createTestRouter;