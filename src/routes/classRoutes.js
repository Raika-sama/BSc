/**
 * @file classRoutes.js
 * @description Router per la gestione delle classi e delle relazioni con docenti e studenti
 */

const express = require('express');
const logger = require('../utils/errors/logger/logger');

/**
 * Crea e configura le rotte per la gestione delle classi
 * @param {Object} options - Opzioni di configurazione
 * @param {Object} options.authMiddleware - Middleware di autenticazione
 * @param {Object} options.classController - Controller per la gestione delle classi
 * @returns {Object} Router Express configurato
 */
const createClassRouter = ({ authMiddleware, classController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!classController) throw new Error('ClassController is required');

    const router = express.Router();
    const { protect, restrictTo } = authMiddleware;

    // Middleware di protezione globale - richiede autenticazione per tutte le rotte
    router.use(protect);

    // Utility per gestione delle funzioni asincrone e catching degli errori
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    // ------------------------------------------------------------------
    // ROTTE PER LA VISUALIZZAZIONE DELLE CLASSI
    // ------------------------------------------------------------------
    
    /**
     * @route GET /api/v1/classes/my-classes
     * @description Recupera le classi associate all'utente corrente
     * @access Private - Richiede autenticazione
     */
    router.get('/my-classes', 
        asyncHandler(classController.getMyClasses.bind(classController))
    );

    /**
     * @route GET /api/v1/classes/school/:schoolId/year/:year
     * @description Recupera le classi di una scuola per un anno accademico specifico
     * @access Private - Richiede autenticazione
     */
    router.get('/school/:schoolId/year/:year(*)', asyncHandler(async (req, res, next) => {
        try {
            const { schoolId, year } = req.params;
            // Normalizza il formato dell'anno (supporta sia 2024-2025 che 2024/2025)
            const normalizedYear = year.includes('/') ? 
                year : 
                year.replace('-', '/');

            await classController.getByAcademicYear(
                { ...req, params: { schoolId, year: normalizedYear } }, 
                res, 
                next
            );
        } catch (error) {
            logger.error('Error in getByAcademicYear:', {
                error: error.message,
                schoolId: req.params.schoolId,
                year: req.params.year
            });
            next(error);
        }
    }));

    /**
     * @route GET /api/v1/classes/school/:schoolId
     * @description Recupera tutte le classi di una scuola
     * @access Private - Richiede autenticazione
     */
    router.get('/school/:schoolId', 
        asyncHandler(classController.getBySchool.bind(classController))
    );

    // ------------------------------------------------------------------
    // ROTTE AMMINISTRATIVE
    // ------------------------------------------------------------------
    
    /**
     * @route POST /api/v1/classes/transition
     * @description Gestisce la transizione delle classi da un anno accademico all'altro
     * @access Private - Richiede ruolo admin
     */
    router.post('/transition', 
        restrictTo('admin'),
        asyncHandler(classController.handleYearTransition.bind(classController))
    );

    /**
     * @route POST /api/v1/classes/initial-setup
     * @description Crea le classi iniziali per una scuola
     * @access Private - Richiede ruolo admin
     */
    router.post('/initial-setup',
        restrictTo('admin'),
        asyncHandler(classController.createInitialClasses.bind(classController))
    );

    // ------------------------------------------------------------------
    // ROTTE PER LA GESTIONE DEGLI STUDENTI
    // ------------------------------------------------------------------
    
    /**
     * @route POST /api/v1/classes/:classId/students
     * @description Aggiunge studenti a una classe
     * @access Private - Richiede ruolo admin o teacher
     */
    router.post('/:classId/students', 
        restrictTo('admin', 'teacher'),
        asyncHandler(classController.addStudents.bind(classController))
    );

    /**
     * @route POST /api/v1/classes/:classId/remove-students
     * @description Rimuove studenti da una classe
     * @access Private - Richiede ruolo admin o teacher
     */
    router.post('/:classId/remove-students',
        restrictTo('admin', 'teacher'),  
        asyncHandler(classController.removeStudentsFromClass.bind(classController))
    );

    // ------------------------------------------------------------------
    // ROTTE PER LA GESTIONE DEI DOCENTI
    // ------------------------------------------------------------------
    
    /**
     * @route POST /api/v1/classes/:classId/update-main-teacher
     * @description Aggiorna il docente principale di una classe
     * @access Private - Richiede ruolo admin
     */
    router.post('/:classId/update-main-teacher', 
        restrictTo('admin'),
        asyncHandler(classController.updateMainTeacher.bind(classController))
    );
    
    /**
     * @route POST /api/v1/classes/:classId/remove-main-teacher
     * @description Rimuove il docente principale da una classe
     * @access Private - Richiede ruolo admin
     */
    router.post('/:classId/remove-main-teacher', 
        restrictTo('admin'),
        asyncHandler(classController.removeMainTeacher.bind(classController))
    );

    /**
     * @route POST /api/v1/classes/:classId/add-teacher
     * @description Aggiunge un docente secondario a una classe
     * @access Private - Richiede ruolo admin
     */
    router.post('/:classId/add-teacher', 
        restrictTo('admin'),
        asyncHandler(classController.addTeacher.bind(classController))
    );

    /**
     * @route DELETE /api/v1/classes/:classId/teachers/:teacherId
     * @description Rimuove un docente secondario da una classe
     * @access Private - Richiede ruolo admin
     */
    router.delete('/:classId/teachers/:teacherId', 
        restrictTo('admin'),
        asyncHandler(classController.removeTeacher.bind(classController))
    );

    // ------------------------------------------------------------------
    // ROTTE CRUD BASE
    // ------------------------------------------------------------------
    
    /**
     * @route GET /api/v1/classes
     * @description Recupera tutte le classi
     * @route POST /api/v1/classes
     * @description Crea una nuova classe
     * @route DELETE /api/v1/classes
     * @description Elimina tutte le classi (solo admin)
     * @access Private
     */
    router.route('/')
        .get(asyncHandler(classController.getAll.bind(classController)))
        .post(
            restrictTo('admin'),
            asyncHandler(classController.create.bind(classController))
        )
        .delete(
            restrictTo('admin'),
            asyncHandler(classController.deleteAll.bind(classController))
        );

    /**
     * @route GET /api/v1/classes/:id
     * @description Recupera i dettagli di una classe specifica
     * @route PUT /api/v1/classes/:id
     * @description Aggiorna una classe
     * @route DELETE /api/v1/classes/:id
     * @description Elimina una classe
     * @access Private
     */
    router.route('/:id')
        .get(asyncHandler(classController.getById.bind(classController)))
        .put(
            restrictTo('admin', 'teacher'),
            asyncHandler(classController.update.bind(classController))
        )
        .delete(
            restrictTo('admin'),
            asyncHandler(classController.delete.bind(classController))
        );

    // ------------------------------------------------------------------
    // GESTIONE DEGLI ERRORI
    // ------------------------------------------------------------------
    
    /**
     * Middleware per la gestione degli errori specifici delle rotte delle classi
     */
    router.use((err, req, res, next) => {
        logger.error('Class Route Error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            role: req.user?.role
        });

        // Gestione errori di autenticazione
        if (err.code === 'AUTH_004' || err.statusCode === 401) {
            return res.status(401).json({
                status: 'error',
                error: {
                    message: 'Non autorizzato',
                    code: 'CLASS_AUTH_ERROR'
                }
            });
        }

        // Gestione errori di validazione
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                status: 'error',
                error: {
                    message: 'Errore di validazione',
                    code: 'CLASS_VALIDATION_ERROR',
                    details: err.errors
                }
            });
        }

        // Altri errori
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            status: 'error',
            error: {
                message: err.message,
                code: err.code || 'CLASS_ROUTE_ERROR'
            }
        });
    });

    return router;
};

module.exports = createClassRouter;