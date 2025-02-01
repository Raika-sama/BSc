/**
 * @file classRoutes.js
 * @description Router per la gestione delle classi
 */

const express = require('express');
const logger = require('../utils/errors/logger/logger');

const createClassRouter = ({ authMiddleware, classController }) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!classController) throw new Error('ClassController is required');

    const router = express.Router();
    const { protect, restrictTo } = authMiddleware;

    // Middleware di protezione globale
    router.use(protect);

    // Utility per gestione async
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    // Route di lettura specifiche (devono venire PRIMA delle route generiche)
    router.get('/my-classes', 
        asyncHandler(classController.getMyClasses.bind(classController))
    );

    // Route per classi di una scuola in un anno specifico
    router.get('/school/:schoolId/year/:year(*)', asyncHandler(async (req, res, next) => {
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
    }));

    router.get('/school/:schoolId', 
        asyncHandler(classController.getBySchool.bind(classController))
    );

    // Route amministrative (richiedono privilegi admin)
    router.post('/transition', 
        restrictTo('admin'),
        asyncHandler(classController.handleYearTransition.bind(classController))
    );

    // Route per la gestione degli studenti
    router.post('/:classId/students', 
        restrictTo('admin', 'teacher'),
        asyncHandler(classController.addStudents.bind(classController))
    );

    router.post('/:classId/remove-students',
        restrictTo('admin', 'teacher'),  
        asyncHandler(classController.removeStudentsFromClass.bind(classController))
    );

    // Route per setup iniziale classi
    router.post('/initial-setup',
        restrictTo('admin'),
        asyncHandler(classController.createInitialClasses.bind(classController))
    );

    // Route base CRUD
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

    // Gestione errori specifica
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