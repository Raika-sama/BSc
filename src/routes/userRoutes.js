/**
 * @file userRoutes.js
 * @description Router per la gestione degli utenti
 * @author Raika-sama
 * @date 2025-02-01 10:24:52
 */

const express = require('express');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

const createUserRouter = ({ authMiddleware, userController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!userController) throw new Error('UserController is required');

    const router = express.Router();
    const { protect, restrictTo } = authMiddleware;

    // Utility per gestione async
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            logger.error('User Route Error:', {
                error: error.message,
                path: req.originalUrl,
                method: req.method,
                userId: req.user?.id,
                timestamp: new Date().toISOString()
            });
            next(error);
        });
    };

    // Middleware di logging
    router.use((req, res, next) => {
        logger.debug('User Route Called:', {
            method: req.method,
            path: req.originalUrl,
            userId: req.user?.id,
            role: req.user?.role,
            timestamp: new Date().toISOString()
        });
        next();
    });

    // Middleware di protezione globale
    router.use(protect);

    // Rotte profilo utente (accessibili a tutti gli utenti autenticati)
    router.get('/me', 
        asyncHandler(userController.getProfile.bind(userController))
    );
    
    router.put('/me', 
        asyncHandler(userController.updateProfile.bind(userController))
    );

    // Rotte gestione utenti (admin/manager only)
    router.use(restrictTo('admin', 'manager'));

    // Route paginata per lista utenti
    router.get('/', asyncHandler(userController.getAll.bind(userController)));

    //rotta per trovare solo utenti admin o manager
    router.get('/available-managers',
        protect,
        restrictTo('admin'),
        asyncHandler(userController.getAvailableManagers.bind(userController))
    );

    // Route CRUD per gestione utenti
    router.route('/:id')
    .get(
        asyncHandler(async (req, res) => {
            console.log('UserRoutes: GET /:id called with:', {
                id: req.params.id,
                user: req.user?.id
            });
            return userController.getById(req, res);
        })
    )
    .put(
        asyncHandler(userController.update.bind(userController))
    )
    .delete(
        asyncHandler(userController.delete.bind(userController))
    );

    // Rotta per creazione nuovo utente
    router.post('/', 
    asyncHandler(userController.create.bind(userController))
    );



    // Gestione errori centralizzata
    router.use((err, req, res, next) => {
        logger.error('User Route Error:', {
            error: err.message,
            stack: err.stack,
            path: req.originalUrl,
            method: req.method,
            userId: req.user?.id,
            targetUserId: req.params.id,
            timestamp: new Date().toISOString()
        });

        // Gestione errori di validazione
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                status: 'error',
                error: {
                    message: 'Errore di validazione',
                    code: 'USER_VALIDATION_ERROR',
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
                    code: 'USER_AUTH_ERROR'
                }
            });
        }

        // Altri errori
        const standardError = createError(
            err.code || ErrorTypes.SYSTEM.INTERNAL_ERROR,
            err.message || 'Errore interno del server',
            { originalError: err }
        );

        res.status(standardError.status).json({
            status: 'error',
            error: {
                code: standardError.code,
                message: standardError.message,
                ...(process.env.NODE_ENV === 'development' && { 
                    stack: err.stack,
                    details: err.metadata 
                })
            }
        });
    });

    return router;
};

module.exports = createUserRouter;

/**
 * @summary Documentazione delle Route
 * 
 * Route Utente (richiede autenticazione):
 * GET    /users/me              - Profilo utente corrente
 * PUT    /users/me              - Aggiorna profilo utente corrente
 * 
 * Route Admin/Manager:
 * GET    /users                 - Lista utenti (paginata, con ricerca)
 * POST   /users                 - Crea nuovo utente
 * GET    /users/:id             - Dettaglio utente
 * PUT    /users/:id             - Aggiorna utente
 * DELETE /users/:id             - Elimina utente
 * 
 * Parametri di paginazione:
 * - page: numero pagina (default: 1)
 * - limit: elementi per pagina (default: 10)
 * - search: termine di ricerca (opzionale)
 * 
 * Controllo Accessi:
 * - Admin/Manager: accesso completo a tutte le route
 * - Altri utenti: solo accesso al proprio profilo (/me)
 */