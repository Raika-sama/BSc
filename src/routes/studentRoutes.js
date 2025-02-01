/**
 * @file studentRoutes.js
 * @description Router per la gestione degli studenti
 * @author Raika-sama
 * @date 2025-02-01 10:21:51
 */

const express = require('express');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const studentValidation = require('../middleware/studentValidation');
const { uploadExcel, handleMulterError } = require('../middleware/upload/uploadMiddleware');

const createStudentRouter = ({ 
    authMiddleware, 
    studentController, 
    studentBulkImportController 
}) => {
    if (!authMiddleware) throw new Error('AuthMiddleware is required');
    if (!studentController) throw new Error('StudentController is required');
    if (!studentBulkImportController) throw new Error('StudentBulkImportController is required');

    const router = express.Router();
    const { protect, restrictTo } = authMiddleware;

    // Utility per gestione async
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            logger.error('Student Route Error:', {
                error: error.message,
                path: req.path,
                method: req.method,
                userId: req.user?.id,
                timestamp: new Date().toISOString()
            });
            next(error);
        });
    };

    // 1. Middleware di logging globale
    router.use((req, res, next) => {
        logger.debug('Student route called:', {
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            role: req.user?.role,
            timestamp: new Date().toISOString()
        });
        next();
    });

    // 2. Protezione globale
    router.use(protect);

    // 3. Route di ricerca e accesso
    router.get('/search', 
        studentValidation.validateSearch,
        asyncHandler(studentController.searchStudents.bind(studentController))
    );

    router.get('/my-students', 
        restrictTo('teacher', 'admin'),
        asyncHandler(studentController.getMyStudents.bind(studentController))
    );

    // 4. Route di importazione bulk (solo admin)
    router.get('/template', 
        restrictTo('admin'),
        asyncHandler(studentBulkImportController.generateTemplate.bind(studentBulkImportController))
    );

    router.post('/bulk-import', 
        restrictTo('admin'),
        uploadExcel,
        handleMulterError,
        asyncHandler(studentBulkImportController.bulkImport.bind(studentBulkImportController))
    );

    // 5. Route per gestione classi
    router.get('/class/:classId',
        restrictTo('teacher', 'admin'),
        asyncHandler(studentController.getStudentsByClass.bind(studentController))
    );

    // 6. Route per studenti non assegnati
    router.get('/unassigned-to-school',
        restrictTo('admin'),
        asyncHandler(studentController.getUnassignedToSchoolStudents.bind(studentController))
    );

    router.get('/unassigned/:schoolId',
        restrictTo('admin'),
        asyncHandler(studentController.getUnassignedStudents.bind(studentController))
    );

    // 7. Route per assegnazioni batch
    router.post('/batch-assign',
        restrictTo('admin'),
        studentValidation.validateBatchAssignment,
        asyncHandler(studentController.batchAssignToClass.bind(studentController))
    );

    router.post('/batch-assign-to-school',
        restrictTo('admin'),
        asyncHandler(studentController.batchAssignToSchool.bind(studentController))
    );

    router.post('/with-class', 
        restrictTo('admin'),
        studentValidation.validateCreate, 
        asyncHandler(studentController.createStudentWithClass.bind(studentController))
    );

    // 8. Route CRUD base
    router.route('/')
        .get(
            restrictTo('teacher', 'admin'),
            asyncHandler(studentController.getAll.bind(studentController))
        )
        .post(
            restrictTo('admin'),
            studentValidation.validateCreate,
            asyncHandler(studentController.create.bind(studentController))
        );

    router.route('/:id')
        .get(
            restrictTo('teacher', 'admin'),
            asyncHandler(studentController.getById.bind(studentController))
        )
        .put(
            restrictTo('admin'),
            studentValidation.validateUpdate,
            asyncHandler(studentController.update.bind(studentController))
        )
        .delete(
            restrictTo('admin'),
            asyncHandler(studentController.delete.bind(studentController))
        );

    // 9. Route per gestione classe singola
    router.post('/:studentId/assign-class',
        restrictTo('admin'),
        studentValidation.validateClassAssignment,
        asyncHandler(studentController.assignToClass.bind(studentController))
    );

    router.post('/:studentId/remove-from-class',
        restrictTo('admin'),
        asyncHandler(studentController.removeFromClass.bind(studentController))
    );

    // 10. Gestione errori centralizzata
    router.use((err, req, res, next) => {
        logger.error('Student route error:', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });

        // Gestione errori di validazione con codice
        if (err.code && err.code === ErrorTypes.VALIDATION.BAD_REQUEST.code) {
            return res.status(400).json({
                status: 'error',
                error: {
                    code: err.code,
                    message: err.message,
                    details: err.metadata?.details
                }
            });
        }

        // Gestione errori con solo messaggio
        if (err.message && !err.code) {
            return res.status(400).json({
                status: 'error',
                error: {
                    message: err.message,
                    details: err.metadata || {}
                }
            });
        }

        // Altri errori
        const finalError = err.code ? err : createError(ErrorTypes.SYSTEM.GENERIC_ERROR, 'Errore sconosciuto');
        const statusCode = err.statusCode || 500;

        res.status(statusCode).json({
            status: 'error',
            error: {
                code: finalError.code,
                message: finalError.message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            }
        });
    });

    return router;
};

module.exports = createStudentRouter;

/**
 * @summary Documentazione delle Route
 * 
 * GET    /api/v1/students                    - Lista studenti (teacher/admin)
 * POST   /api/v1/students                    - Crea studente (admin)
 * GET    /api/v1/students/:id                - Dettaglio studente (teacher/admin)
 * PUT    /api/v1/students/:id                - Modifica studente (admin)
 * DELETE /api/v1/students/:id                - Elimina studente (admin)
 * GET    /api/v1/students/search             - Ricerca studenti (teacher/admin)
 * GET    /api/v1/students/my-students        - Studenti del docente (teacher/admin)
 * GET    /api/v1/students/class/:id          - Studenti per classe (teacher/admin)
 * POST   /api/v1/students/:id/assign-class   - Assegna a classe (admin)
 * POST   /api/v1/students/:id/remove-from-class - Rimuove da classe (admin)
 * GET    /api/v1/students/unassigned/:schoolId - Lista studenti non assegnati (admin)
 * POST   /api/v1/students/batch-assign       - Assegnazione multipla a classe (admin)
 * 
 * Controllo Accessi:
 * - Admin: accesso completo
 * - Teacher: solo lettura e propri studenti
 * - Altri: nessun accesso
 */