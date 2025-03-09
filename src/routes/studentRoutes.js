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
    // Estrai hasPermission oltre a protect e restrictTo
    const { protect, restrictTo, hasPermission } = authMiddleware;

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
        hasPermission('students', 'read'),  // Sostituisce restrictTo
        studentValidation.validateSearch,
        asyncHandler(studentController.searchStudents.bind(studentController))
    );

    // In questo caso, potremmo voler mantenere restrictTo per chiarezza
    // e aggiungere hasPermission per maggiore granularità
    router.get('/my-students', 
        restrictTo('teacher', 'admin'),
        hasPermission('students', 'read'),  // Verifica il permesso e anche il contesto
        asyncHandler(studentController.getMyStudents.bind(studentController))
    );

    router.get('/count', 
        hasPermission('students', 'read'),  // Permesso di lettura studenti
        asyncHandler(studentController.countByClasses.bind(studentController))
    );
    
    router.post('/check-emails', 
        hasPermission('students', 'read'),  // Permesso di lettura studenti
        asyncHandler(studentController.checkEmails.bind(studentController))
    );

    // 4. Route di importazione bulk
    router.get('/template', 
        hasPermission('students', 'create'),  // Verifica permesso di creazione
        asyncHandler(studentBulkImportController.generateTemplate.bind(studentBulkImportController))
    );

    router.post('/bulk-import', 
        hasPermission('students', 'create'),  // Verifica permesso di creazione
        uploadExcel,
        handleMulterError,
        asyncHandler(studentBulkImportController.bulkImport.bind(studentBulkImportController))
    );
    
    router.post('/bulk-import-with-class', 
        hasPermission('students', 'create'),  // Verifica permesso di creazione
        hasPermission('classes', 'update'),   // E anche permesso di aggiornare classi
        asyncHandler(studentBulkImportController.bulkImportWithClass.bind(studentBulkImportController))
    );

    // 5. Route per gestione classi
    router.get('/class/:classId',
        hasPermission('students', 'read'),  // Verificherà anche il contesto della classe
        asyncHandler(studentController.getStudentsByClass.bind(studentController))
    );

    // 6. Route per studenti non assegnati
    router.get('/unassigned-to-school',
        hasPermission('students', 'read'),
        hasPermission('schools', 'read'),
        asyncHandler(studentController.getUnassignedToSchoolStudents.bind(studentController))
    );

    router.get('/unassigned/:schoolId',
        hasPermission('students', 'read'),
        hasPermission('schools', 'read'),
        asyncHandler(studentController.getUnassignedStudents.bind(studentController))
    );

    // 7. Route per assegnazioni batch
    router.post('/batch-assign',
        hasPermission('students', 'update'),
        hasPermission('classes', 'update'),
        studentValidation.validateBatchAssignment,
        asyncHandler(studentController.batchAssignToClass.bind(studentController))
    );

    router.post('/batch-assign-to-school',
        hasPermission('students', 'update'),
        hasPermission('schools', 'update'),
        asyncHandler(studentController.batchAssignToSchool.bind(studentController))
    );

    router.post('/with-class', 
        hasPermission('students', 'create'),
        hasPermission('classes', 'update'),
        studentValidation.validateCreate, 
        asyncHandler(studentController.createStudentWithClass.bind(studentController))
    );

    // 8. Route CRUD base
    router.route('/')
        .get(
            hasPermission('students', 'read'),
            asyncHandler(studentController.getAll.bind(studentController))
        )
        .post(
            hasPermission('students', 'create'),
            studentValidation.validateCreate,
            asyncHandler(studentController.create.bind(studentController))
        );

    router.route('/:id')
        .get(
            hasPermission('students', 'read'),
            asyncHandler(studentController.getById.bind(studentController))
        )
        .put(
            hasPermission('students', 'update'),
            studentValidation.validateUpdate,
            asyncHandler(studentController.update.bind(studentController))
        )
        .delete(
            hasPermission('students', 'delete'),
            asyncHandler(studentController.delete.bind(studentController))
        );

    // 9. Route per gestione classe singola
    router.post('/:studentId/assign-class',
        hasPermission('students', 'update'),
        hasPermission('classes', 'update'),
        studentValidation.validateClassAssignment,
        asyncHandler(studentController.assignToClass.bind(studentController))
    );

    router.post('/:studentId/remove-from-class',
        hasPermission('students', 'update'),
        hasPermission('classes', 'update'),
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
 * GET    /api/v1/students                     - Lista studenti (teacher/admin)
 * POST   /api/v1/students                     - Crea studente (admin)
 * GET    /api/v1/students/:id                 - Dettaglio studente (teacher/admin)
 * PUT    /api/v1/students/:id                 - Modifica studente (admin)
 * DELETE /api/v1/students/:id                 - Elimina studente (admin)
 * GET    /api/v1/students/search              - Ricerca studenti (teacher/admin)
 * GET    /api/v1/students/my-students         - Studenti del docente (teacher/admin)
 * GET    /api/v1/students/class/:id           - Studenti per classe (teacher/admin)
 * POST   /api/v1/students/:id/assign-class    - Assegna a classe (admin)
 * POST   /api/v1/students/:id/remove-from-class - Rimuove da classe (admin)
 * GET    /api/v1/students/unassigned/:schoolId - Lista studenti non assegnati (admin)
 * POST   /api/v1/students/batch-assign        - Assegnazione multipla a classe (admin)
 * POST   /api/v1/students/bulk-import         - Import massivo da file Excel (admin)
 * POST   /api/v1/students/bulk-import-with-class - Import con assegnazione classe (admin)
 * GET    /api/v1/students/template            - Scarica template Excel (admin)
 * POST   /api/v1/students/check-emails        - Verifica email duplicate
 * 
 * Controllo Accessi:
 * - Admin: accesso completo
 * - Teacher: solo lettura e propri studenti
 * - Altri: nessun accesso
 */