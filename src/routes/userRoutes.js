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

// Aggiunta della nuova rotta POST - Creazione nuovo utente da app
router.post('/', async (req, res, next) => {
    try {
        logger.debug('Creating new user:', req.body);
        const result = await userController.register(req, res, next);
        logger.debug('User created:', result);
        return result;
    } catch (error) {
        logger.error('Error creating user:', error);
        next(error);
    }
});

// Modifica utente
router.put('/:id', async (req, res, next) => {
    try {
        logger.debug('Updating user:', {
            userId: req.params.id,
            updates: req.body
        });
        const result = await userController.update(req, res, next);
        logger.debug('User updated:', result);
        return result;
    } catch (error) {
        logger.error('Error updating user:', error);
        next(error);
    }
});

// Eliminazione utente
router.delete('/:id', async (req, res, next) => {
    try {
        logger.debug('Deleting user:', {
            userId: req.params.id
        });
        const result = await userController.delete(req, res, next);
        logger.debug('User deleted:', result);
        return result;
    } catch (error) {
        logger.error('Error deleting user:', error);
        next(error);
    }
});



// Lista utenti
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const result = await userController.getAll({
            page,
            limit,
            search
        });

        res.status(200).json({
            status: 'success',
            data: {
                users: result.users,
                total: result.total,
                page,
                limit
            }
        });
    } catch (error) {
        next(error);
    }
});

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