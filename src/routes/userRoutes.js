/**
 * @file userRoutes.js
 * @description Router per la gestione degli utenti
 * @author Raika-sama
 * @date 2025-02-26 (aggiornato)
 */

const express = require('express');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

const createUserRouter = ({ authMiddleware, userController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!userController) throw new Error('UserController is required');

    const router = express.Router();
    const { protect, hasPermission } = authMiddleware;

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
        hasPermission('users', 'read'),
        asyncHandler(userController.getProfile.bind(userController))
    );
    
    router.put('/me', 
        hasPermission('users', 'update'),
        asyncHandler(userController.updateProfile.bind(userController))
    );

    // Middleware specifico per la creazione di utenti
    // Verifica che i manager possano creare solo determinati ruoli
    const validateUserCreation = (req, res, next) => {
        try {
            // Admin e developer possono creare qualsiasi tipo di utente
            if (['admin', 'developer'].includes(req.user.role)) {
                return next();
            }
            
            // Manager possono creare solo determinati ruoli e solo per la propria scuola
            if (req.user.role === 'manager') {
                const allowedRoles = ['teacher', 'pcto', 'tutor']; // Nota: 'student' non c'è perché gli studenti sono gestiti separatamente
                
                // Verifica il ruolo richiesto
                if (!allowedRoles.includes(req.body.role)) {
                    return next(createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        `Non è possibile creare utenti di tipo "${req.body.role}"`
                    ));
                }
                
                // Verifica che la scuola sia quella del manager
                if (req.body.schoolId && req.user.schoolId && 
                    req.body.schoolId.toString() !== req.user.schoolId.toString()) {
                    return next(createError(
                        ErrorTypes.AUTH.FORBIDDEN,
                        'Non è possibile creare utenti per altre scuole'
                    ));
                }
                
                // Se non è specificata una scuola, impostiamo quella del manager
                if (!req.body.schoolId && req.user.schoolId) {
                    req.body.schoolId = req.user.schoolId;
                }
                
                return next();
            }
            
            // Altri ruoli non possono creare utenti
            return next(createError(
                ErrorTypes.AUTH.FORBIDDEN,
                'Non hai i permessi per creare nuovi utenti'
            ));
        } catch (error) {
            next(error);
        }
    };

    // Route per i manager disponibili (solo admin/developer)
    router.get('/available-managers',
        hasPermission('users', 'read'),
        asyncHandler(userController.getAvailableManagers.bind(userController))
    );

    // Route paginata per lista utenti
    router.get('/', 
        hasPermission('users', 'read'),
        asyncHandler(userController.getAll.bind(userController))
    );

    // Route per insegnanti di una scuola specifica
    router.get('/school/:schoolId/teachers', 
        hasPermission('users', 'read'),
        hasPermission('schools', 'read'),
        asyncHandler(userController.getSchoolTeachers.bind(userController))
    );

    // Route per lo storico delle modifiche di un utente
    router.get('/:id/history',
        hasPermission('users', 'read'),
        asyncHandler(userController.getUserHistory.bind(userController))
    );

    // Route CRUD per gestione utenti
    router.route('/:id')
        .get(
            hasPermission('users', 'read'),
            asyncHandler(async (req, res) => {
                console.log('UserRoutes: GET /:id called with:', {
                    id: req.params.id,
                    user: req.user?.id
                });
                return userController.getById(req, res);
            })
        )
        .put(
            hasPermission('users', 'update'),
            asyncHandler(userController.update.bind(userController))
        )
        .delete(
            hasPermission('users', 'delete'),
            asyncHandler(userController.delete.bind(userController))
        );

    // Rotta per creazione nuovo utente
    router.post('/', 
        hasPermission('users', 'create'),
        validateUserCreation,
        asyncHandler(userController.create.bind(userController))
    );

    // Nuove rotte per i permessi e le risorse (solo se il controller ha questi metodi)
    if (typeof userController.updatePermissions === 'function') {
        router.post('/:id/permissions',
            hasPermission('users', 'manage'),
            asyncHandler(userController.updatePermissions.bind(userController))
        );
    }

    if (typeof userController.assignResources === 'function') {
        router.post('/:id/resources',
            hasPermission('users', 'update'),
            asyncHandler(userController.assignResources.bind(userController))
        );
    }

    if (typeof userController.changeStatus === 'function') {
        // Cambio da POST a PUT per corrispondere alla chiamata del frontend
        router.put('/:id/status',
            hasPermission('users', 'update'),
            asyncHandler(userController.changeStatus.bind(userController))
        );
    }

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

        // Gestione errori di permessi
        if (err.code === 'AUTH_003' || err.statusCode === 403) {
            return res.status(403).json({
                status: 'error',
                error: {
                    message: 'Permessi insufficienti',
                    code: 'USER_PERMISSION_ERROR'
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
 * Route Admin/Developer:
 * GET    /users                 - Lista utenti (paginata, con ricerca)
 * POST   /users                 - Crea nuovo utente
 * GET    /users/:id             - Dettaglio utente
 * PUT    /users/:id             - Aggiorna utente
 * DELETE /users/:id             - Elimina utente
 * POST   /users/:id/permissions - Aggiorna permessi utente
 * POST   /users/:id/resources   - Assegna risorse a utente (scuola, classi, studenti)
 * PUT    /users/:id/status      - Cambia stato utente (attivo/inattivo/sospeso)
 * GET    /users/:id/history     - Ottiene lo storico delle modifiche di un utente
 * 
 * Route Manager:
 * GET    /users                 - Lista utenti (filtrata per propria scuola)
 * GET    /users/:id             - Dettaglio utente (solo propria scuola)
 * 
 * Parametri di paginazione:
 * - page: numero pagina (default: 1)
 * - limit: elementi per pagina (default: 10)
 * - search: termine di ricerca (opzionale)
 * - role: filtra per ruolo (opzionale)
 * - schoolId: filtra per scuola (opzionale)
 * 
 * Controllo Accessi:
 * - Admin/Developer: accesso completo a tutte le route e funzionalità
 * - Manager: accesso limitato agli utenti della propria scuola
 * - Altri ruoli: solo accesso al proprio profilo (/me)
 * 
 * Livelli di accesso ai test:
 * - 0/1: Admin/Developer, accesso a tutti i test
 * - 2/3: Manager/PCTO, test della propria scuola
 * - 4: Teacher, test delle proprie classi
 * - 5/7: Tutor/Health, test dei propri studenti
 * - 8: Student, solo test assegnati
 */