// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { user: userController } = require('../controllers');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/errors/logger/logger');

// Debug log per verificare il controller
logger.debug('User Controller loaded:', {
    controllerMethods: userController ? Object.keys(userController) : 'Controller not found'
});

// Rotte pubbliche
router.post('/login', (req, res, next) => userController.login(req, res, next));
router.post('/register', (req, res, next) => userController.register(req, res, next));
router.post('/forgot-password', (req, res, next) => userController.forgotPassword(req, res, next));

// Middleware di protezione
router.use(protect);

// Rotte protette
router.get('/me', (req, res, next) => {
    const userId = req.user.id;
    req.params.id = userId; // Imposta l'id nei params per il getById
    userController.getById(req, res, next);
});

router.put('/me', (req, res, next) => {
    const userId = req.user.id;
    req.params.id = userId; // Imposta l'id nei params per l'update
    userController.update(req, res, next);
});

router.put('/update-password', (req, res, next) => userController.updatePassword(req, res, next));

// Error handler
router.use((err, req, res, next) => {
    logger.error('User Route Error:', {
        error: err.message,
        stack: err.stack
    });

    res.status(err.statusCode || 500).json({
        status: 'error',
        error: {
            message: err.message,
            code: err.code || 'USER_ERROR'
        }
    });
});

module.exports = router;