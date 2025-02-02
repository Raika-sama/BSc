// src/routes/schoolRoutes.js
const express = require('express');
const logger = require('../utils/errors/logger/logger');

const createSchoolRouter = ({ authMiddleware, schoolController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!schoolController) throw new Error('SchoolController is required');

    const router = express.Router();
    const { protect, restrictTo } = authMiddleware;

    // Utility per gestione async
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

    // Middleware di logging
    router.use((req, res, next) => {
        logger.debug('School Route Called:', {
            method: req.method,
            path: req.path,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });
        next();
    });

    // Protezione globale per tutte le route
    router.use(protect);

    // 1. Rotte generali
    router.get('/my-school', 
        asyncHandler(schoolController.getMySchool.bind(schoolController))
    );

    router.get('/region/:region', 
        asyncHandler(schoolController.getByRegion.bind(schoolController))
    );

    router.get('/type/:type', 
        asyncHandler(schoolController.getByType.bind(schoolController))
    );

    // 2. Rotte di configurazione (solo admin)
    router.get('/:id/academic-years', 
        asyncHandler(schoolController.getAcademicYears.bind(schoolController))
    );

    router.post('/:id/academic-years', 
        restrictTo('admin'),
        asyncHandler(schoolController.setupAcademicYear.bind(schoolController))
    );

    router.post('/:id/setup', 
        restrictTo('admin'),
        asyncHandler(schoolController.setupInitialConfiguration.bind(schoolController))
    );

    // 3. Rotte per la gestione delle sezioni
    const sectionsRouter = express.Router({ mergeParams: true });
    router.use('/:schoolId/sections', sectionsRouter);

    sectionsRouter.get('/', 
        asyncHandler(schoolController.getSections.bind(schoolController))
    );

    sectionsRouter.get('/:sectionName/students', 
        asyncHandler(schoolController.getSectionStudents.bind(schoolController))
    );

    sectionsRouter.post('/:sectionName/deactivate', 
        restrictTo('admin'),
        asyncHandler(schoolController.deactivateSection.bind(schoolController))
    );

    sectionsRouter.post('/:sectionName/reactivate',
        restrictTo('admin'),
        asyncHandler(schoolController.reactivateSection.bind(schoolController))
    );

    // 4. Rotte CRUD base
    router.route('/')
        .get(asyncHandler(schoolController.getAll.bind(schoolController)))
        .post(
            restrictTo('admin'),
            asyncHandler(schoolController.create.bind(schoolController))
        );

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

    // POST /schools/:id/users
    router.post('/:id/users', protect, restrictTo('admin'), async (req, res) => {
        const { id } = req.params;
        const { userId, role } = req.body;
        
        try {
            // Aggiunge l'utente alla scuola
            const school = await schoolController.addUserToSchool(id, userId, role);
            
            res.status(200).json({
                status: 'success',
                data: { school }
            });
        } catch (error) {
            next(error);
        }
    });

    router.post('/:id/remove-manager',
        restrictTo('admin'),
        asyncHandler(schoolController.removeManagerFromSchool.bind(schoolController))
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
 * 
 * Route Admin:
 * POST   /schools/:id/academic-years     - Setup anno accademico
 * POST   /schools/:id/setup              - Setup iniziale configurazione
 * POST   /schools/:id/sections/:name/deactivate - Disattiva sezione
 * POST   /schools/:id/sections/:name/reactivate - Riattiva sezione
 * 
 * Route Sezioni:
 * GET    /schools/:id/sections           - Lista sezioni
 * GET    /schools/:id/sections/:name/students - Studenti di una sezione
 * 
 * Route CRUD:
 * GET    /schools                        - Lista tutte le scuole
 * POST   /schools                        - Crea nuova scuola (admin)
 * GET    /schools/:id                    - Dettagli scuola
 * PUT    /schools/:id                    - Aggiorna scuola (admin)
 * DELETE /schools/:id                    - Elimina scuola (admin)
 */