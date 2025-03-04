// src/routes/schoolRoutes.js
/**
 * Routes per la gestione delle scuole
 * Definisce le API RESTful per il modulo scuole
 * 
 * @module routes/schoolRoutes
 * @requires express
 * @requires utils/errors/logger
 * @requires controllers/userController
 */
const express = require('express');
const logger = require('../utils/errors/logger/logger');
const userController = require('../controllers/userController');
const createYearTransitionRouter = require('./yearTransitionRoutes');

/**
 * Crea il router per le scuole
 * @param {Object} options - Opzioni di configurazione
 * @param {Object} options.authMiddleware - Middleware di autenticazione
 * @param {Object} options.schoolController - Controller delle scuole
 * @returns {Router} Express router configurato per le scuole
 */
const createSchoolRouter = ({ authMiddleware, schoolController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!schoolController) throw new Error('SchoolController is required');

    const router = express.Router();
    const { protect, restrictTo } = authMiddleware;

    /**
     * Utility per gestire le funzioni asincrone e catturare errori
     * @param {Function} fn - Funzione asincrona da gestire
     * @returns {Function} Middleware Express che gestisce gli errori delle Promise
     */
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            logger.error('School Route Error:', {
                error: error.message,
                path: req.path,
                method: req.method,
                userId: req.user?.id,
                timestamp: new Date().toISOString()
            });
            next(error);
        });
    };

    // Middleware di logging per tutte le richieste
    router.use((req, res, next) => {
        logger.debug('School Route Called:', {
            method: req.method,
            path: req.path,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });
        next();
    });

    // Protezione globale per tutte le route - richiede autenticazione
    router.use(protect);

    // 1. Rotte generali
    /**
     * @route GET /api/schools/my-school
     * @desc Ottiene la scuola dell'utente corrente
     * @access Private - Tutti gli utenti autenticati
     */
    router.get('/my-school', 
        asyncHandler(schoolController.getMySchool.bind(schoolController))
    );

    /**
     * @route GET /api/schools/region/:region
     * @desc Ottiene le scuole per regione
     * @access Private - Tutti gli utenti autenticati
     */
    router.get('/region/:region', 
        asyncHandler(schoolController.getByRegion.bind(schoolController))
    );

    /**
     * @route GET /api/schools/type/:type
     * @desc Ottiene le scuole per tipo (middle_school, high_school)
     * @access Private - Tutti gli utenti autenticati
     */
    router.get('/type/:type', 
        asyncHandler(schoolController.getByType.bind(schoolController))
    );

    // 2. Rotte di configurazione per anni accademici
    /**
     * @route GET /api/schools/:id/academic-years
     * @desc Ottiene gli anni accademici di una scuola
     * @access Private - Tutti gli utenti autenticati
     */
    router.get('/:id/academic-years', 
        asyncHandler(schoolController.getAcademicYears.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:id/academic-years
     * @desc Aggiunge un nuovo anno accademico a una scuola
     * @access Private - Admin e manager della scuola
     */
    router.post('/:id/academic-years', 
        asyncHandler(schoolController.setupAcademicYear.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:id/academic-years/:yearId/activate
     * @desc Attiva un anno accademico specifico
     * @access Private - Admin e manager della scuola
     */
    router.post('/:id/academic-years/:yearId/activate',
        asyncHandler(schoolController.activateAcademicYear.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:id/academic-years/:yearId/archive
     * @desc Archivia un anno accademico specifico
     * @access Private - Admin e manager della scuola
     */
    router.post('/:id/academic-years/:yearId/archive',
        asyncHandler(schoolController.archiveAcademicYear.bind(schoolController))
    );

    /**
     * Integra le route per la transizione tra anni accademici
     */
    const yearTransitionRouter = createYearTransitionRouter({ authMiddleware });
    router.use('/:schoolId', yearTransitionRouter);


    /**
     * @route GET /api/schools/:id/classes
     * @desc Ottiene le classi per un determinato anno accademico
     * @access Private - Tutti gli utenti autenticati
     */
    router.get('/:id/classes',
        asyncHandler(schoolController.getClassesByAcademicYear.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:id/setup
     * @desc Esegue la configurazione iniziale di una scuola
     * @access Private - Solo admin
     */
    router.post('/:id/setup', 
        restrictTo('admin'),
        asyncHandler(schoolController.setupInitialConfiguration.bind(schoolController))
    );

    // 3. Rotte per la gestione delle sezioni
    const sectionsRouter = express.Router({ mergeParams: true });
    router.use('/:schoolId/sections', sectionsRouter);

    /**
     * @route GET /api/schools/:schoolId/sections
     * @desc Ottiene tutte le sezioni di una scuola
     * @access Private - Tutti gli utenti autenticati
     */
    sectionsRouter.get('/', 
        asyncHandler(schoolController.getSections.bind(schoolController))
    );

    /**
     * @route GET /api/schools/:schoolId/sections/:sectionName/students
     * @desc Ottiene gli studenti di una specifica sezione
     * @access Private - Tutti gli utenti autenticati
     */
    sectionsRouter.get('/:sectionName/students', 
        asyncHandler(schoolController.getSectionStudents.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:schoolId/sections/:sectionName/deactivate
     * @desc Disattiva una sezione della scuola
     * @access Private - Solo admin
     */
    sectionsRouter.post('/:sectionName/deactivate', 
        restrictTo('admin'),
        asyncHandler(schoolController.deactivateSection.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:schoolId/sections/:sectionName/reactivate
     * @desc Riattiva una sezione della scuola
     * @access Private - Solo admin
     */
    sectionsRouter.post('/:sectionName/reactivate',
        restrictTo('admin'),
        asyncHandler(schoolController.reactivateSection.bind(schoolController))
    );

    
    /**
     * @route POST /api/schools/:id/sections
     * @desc Crea una nuova sezione
     * @access Private - Admin
     */
    router.post('/:id/sections', 
        restrictTo('admin'),
        asyncHandler(schoolController.createSection.bind(schoolController))
    );

    // 4. Rotte CRUD base
    /**
     * @route GET /api/schools
     * @desc Ottiene tutte le scuole
     * @access Private - Tutti gli utenti autenticati
     * 
     * @route POST /api/schools
     * @desc Crea una nuova scuola
     * @access Private - Solo admin
     */
    router.route('/')
        .get(asyncHandler(schoolController.getAll.bind(schoolController)))
        .post(
            restrictTo('admin'),
            asyncHandler(schoolController.create.bind(schoolController))
        );

    /**
     * @route GET /api/schools/:id
     * @desc Ottiene i dettagli di una scuola
     * @access Private - Tutti gli utenti autenticati
     * 
     * @route PUT /api/schools/:id
     * @desc Aggiorna una scuola
     * @access Private - Solo admin
     * 
     * @route DELETE /api/schools/:id
     * @desc Elimina una scuola
     * @access Private - Solo admin
     */
    router.route('/:id')
        .get(asyncHandler(schoolController.getById.bind(schoolController)))
        .put(
            restrictTo('admin'),
            asyncHandler(schoolController.update.bind(schoolController))
        )
        .delete(
            restrictTo('admin'),
            asyncHandler(schoolController.delete.bind(schoolController))
        );

    // 5. Rotte per la gestione degli utenti della scuola
    /**
     * @route POST /api/schools/:id/users
     * @desc Aggiunge un utente a una scuola
     * @access Private - Admin, developer o manager della scuola
     */
    router.post('/:id/users', 
        asyncHandler(schoolController.addUserToSchool.bind(schoolController))
    );

    /**
     * @route DELETE /api/schools/:id/users
     * @desc Rimuove un utente da una scuola
     * @access Private - Admin, developer o manager della scuola
     */
    router.delete('/:id/users', 
        asyncHandler(schoolController.removeUserFromSchool.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:id/add-manager
     * @desc Aggiunge un manager a una scuola
     * @access Private - Solo admin
     */
    router.post('/:id/add-manager',
        restrictTo('admin'),
        asyncHandler(schoolController.addManagerToSchool.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:id/remove-manager
     * @desc Rimuove il manager da una scuola
     * @access Private - Solo admin
     */
    router.post('/:id/remove-manager',
        restrictTo('admin'),
        asyncHandler(schoolController.removeManagerFromSchool.bind(schoolController))
    );

    /**
     * @route POST /api/schools/:id/create-user
     * @desc Crea un nuovo utente e lo associa direttamente alla scuola
     * @access Private - Admin, developer o manager della scuola
     */
    router.post('/:id/create-user', 
        asyncHandler(schoolController.createAndAssociateUser.bind(schoolController))
    );

    router.post('/:id/change-type',
        restrictTo('admin'),
        asyncHandler(schoolController.changeSchoolType.bind(schoolController))
    );

    // Gestione errori specifica per le scuole
    router.use((err, req, res, next) => {
        logger.error('School Route Error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            role: req.user?.role,
            timestamp: new Date().toISOString()
        });

        // Gestione errori di autenticazione
        if (err.code === 'AUTH_004' || err.statusCode === 401) {
            return res.status(401).json({
                status: 'error',
                error: {
                    message: 'Non autorizzato',
                    code: 'SCHOOL_AUTH_ERROR'
                }
            });
        }

        // Gestione errori di validazione
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                status: 'error',
                error: {
                    message: 'Errore di validazione',
                    code: 'SCHOOL_VALIDATION_ERROR',
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
                code: err.code || 'SCHOOL_ROUTE_ERROR'
            }
        });
    });

    return router;
};

module.exports = createSchoolRouter;

/**
 * @summary Documentazione delle Route
 * 
 * Route Protette (richiede autenticazione):
 * GET    /schools/my-school              - Ottiene la scuola dell'utente corrente
 * GET    /schools/region/:region         - Ottiene scuole per regione
 * GET    /schools/type/:type             - Ottiene scuole per tipo
 * GET    /schools/:id/academic-years     - Ottiene anni accademici di una scuola
 * POST   /schools/:id/academic-years     - Crea nuovo anno accademico
 * POST   /schools/:id/academic-years/:yearId/activate - Attiva un anno accademico
 * POST   /schools/:id/academic-years/:yearId/archive - Archivia un anno accademico
 * GET    /schools/:id/classes            - Ottiene classi per anno accademico
 * 
 * Route Admin:
 * POST   /schools/:id/setup              - Setup iniziale configurazione
 * POST   /schools/:id/sections/:name/deactivate - Disattiva sezione
 * POST   /schools/:id/sections/:name/reactivate - Riattiva sezione
 * 
 * Route Sezioni:
 * GET    /schools/:id/sections           - Lista sezioni
 * GET    /schools/:id/sections/:name/students - Studenti di una sezione
 * 
 * Route Gestione Utenti:
 * POST   /schools/:id/users              - Aggiunge un utente alla scuola
 * DELETE /schools/:id/users              - Rimuove un utente dalla scuola
 * POST   /schools/:id/add-manager        - Aggiunge un manager alla scuola
 * POST   /schools/:id/remove-manager     - Rimuove il manager dalla scuola
 * 
 * Route CRUD:
 * GET    /schools                        - Lista tutte le scuole
 * POST   /schools                        - Crea nuova scuola (admin)
 * GET    /schools/:id                    - Dettagli scuola
 * PUT    /schools/:id                    - Aggiorna scuola (admin)
 * DELETE /schools/:id                    - Elimina scuola (admin)
 */