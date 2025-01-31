/**
 * @file userRoutes.js
 * @description Router per la gestione degli utenti
 * @author Raika-sama
 * @date 2025-01-31
 */

const express = require('express');
const router = express.Router();
const { user: userController } = require('../controllers');
const { protect } = require('../middleware/authMiddleware');
const { PermissionMiddleware } = require('../middleware/permissionMiddleware');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

/**
 * Wrapper per gestione errori asincrona
 * @param {Function} fn - Function handler della route
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        logger.error('Route Error Handler', {
            error,
            path: req.originalUrl,
            method: req.method
        });
        next(error);
    });
};

// Debug log per verificare il controller
logger.debug('User Controller loaded:', {
    controllerMethods: userController ? Object.keys(userController) : 'Controller not found'
});

// Middleware di protezione
router.use(protect);

// Rotte profilo utente
router.get('/me', 
    asyncHandler(userController.getProfile.bind(userController))
);

router.put('/me', 
    asyncHandler(userController.updateProfile.bind(userController))
);

router.put('/update-password', 
    asyncHandler(userController.updatePassword.bind(userController))
);

// Rotte gestione utenti (admin/manager only)
router.use(permissionMiddleware.checkRole('admin', 'manager'));

router.post('/', 
    asyncHandler(userController.create.bind(userController))
);

router.get('/', 
    asyncHandler(async (req, res) => {
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
    })
);

router.get('/:id', 
    asyncHandler(userController.getById.bind(userController))
);

router.put('/:id', 
    asyncHandler(userController.update.bind(userController))
);

router.delete('/:id', 
    asyncHandler(userController.delete.bind(userController))
);

// Error handler
router.use((err, req, res, next) => {
    logger.error('User Route Error:', {
        error: err,
        path: req.originalUrl,
        method: req.method
    });

    const standardError = createError(
        err.code || ErrorTypes.SYSTEM.INTERNAL_ERROR,
        err.message || 'Errore interno del server',
        { originalError: err }
    );

    res.status(standardError.status).json({
        status: 'error',
        code: standardError.code,
        message: standardError.message
    });
});

module.exports = router;