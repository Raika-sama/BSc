/**
 * @file classRoutes.js
 * @description Router per la gestione delle classi
 * @author Raika-sama
 * @date 2025-01-31
 */

const express = require('express');
const router = express.Router();
const { class: classController } = require('../controllers');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');

// Applica il middleware protect a tutte le route
router.use(protect);

// 1. Route di lettura specifiche (devono venire PRIMA delle route generiche)
router.get('/my-classes', classController.getMyClasses.bind(classController));

router.get('/school/:schoolId/year/:year(*)', async (req, res, next) => {
    try {
        const { schoolId, year } = req.params;
        const normalizedYear = year.includes('/') ? year : year.replace('-', '/');

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

router.get('/school/:schoolId', classController.getBySchool.bind(classController));

// 2. Route amministrative (solo admin)
router.post('/transition', 
    restrictTo('admin'),
    classController.handleYearTransition.bind(classController)
);

router.post('/initial-setup',
    restrictTo('admin'),
    classController.createInitialClasses.bind(classController)
);

// 3. Route per la gestione degli studenti (admin e teacher)
router.post('/:classId/students', 
    restrictTo('admin', 'teacher'),
    classController.addStudents.bind(classController)
);

router.post('/:classId/remove-students',
    restrictTo('admin', 'teacher'),  
    classController.removeStudentsFromClass.bind(classController)
);

// 4. Route base CRUD
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

// 5. Gestione errori personalizzata
router.use((err, req, res, next) => {
    logger.error('Class Route Error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        role: req.user?.role
    });

    // Errori di autenticazione
    if (err.code === 'AUTH_004' || err.statusCode === 401) {
        return res.status(401).json({
            status: 'error',
            error: {
                message: 'Non autorizzato',
                code: 'CLASS_AUTH_ERROR'
            }
        });
    }

    // Errori di validazione
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