/**
 * @file classRoutes.js
 * @description Router per la gestione delle classi
 */

const express = require('express');
const router = express.Router();
const { class: classController } = require('../controllers');
const logger = require('../utils/errors/logger/logger');
const { protect, restrictTo } = require('../middleware/authMiddleware');

    // Applica il middleware protect a tutte le route
    router.use(protect);

    // Route di lettura specifiche (devono venire PRIMA delle route generiche)
    router.get('/my-classes', 
        classController.getMyClasses.bind(classController)
    );

    // Route di lettura specifiche (devono venire PRIMA delle route generiche)
    router.get('/school/:schoolId/year/:year(*)', async (req, res, next) => {
        try {
            const { schoolId, year } = req.params;
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
    });

    router.get('/school/:schoolId', 
        classController.getBySchool.bind(classController)
    );

    // Route amministrative (richiedono privilegi admin)
    router.post('/transition', 
        restrictTo('admin'),
        classController.handleYearTransition.bind(classController)
    );

    // Route per la gestione degli studenti
    router.post('/:classId/students', 
        restrictTo('admin', 'teacher'),
        classController.addStudents.bind(classController)
    );

    // Aggiungi questa nuova route PRIMA delle route base CRUD
    // Route per setup iniziale classi (dopo creazione scuola)
    router.post('/initial-setup',
        restrictTo('admin'),
        classController.createInitialClasses.bind(classController)
    );

// Route base CRUD per le classi (devono venire DOPO le route specifiche)
router.route('/')
    .get(classController.getAll.bind(classController))
    .post(
        restrictTo('admin'),
        classController.create.bind(classController)
    )
    .delete(
        restrictTo('admin'),
        classController.deleteAll.bind(classController)
    );

router.route('/:id')
    .get(classController.getById.bind(classController))
    .put(
        restrictTo('admin', 'teacher'),
        classController.update.bind(classController)
    )
    .delete(
        restrictTo('admin'),
        classController.delete.bind(classController)
    );

// Gestione errori specifica per le route delle classi
router.use((err, req, res, next) => {
    logger.error('Class Route Error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        role: req.user?.role
    });

    // Gestione specifica degli errori di autenticazione
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

module.exports = router;