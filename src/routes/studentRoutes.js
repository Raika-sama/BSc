/**
 * @file studentRoutes.js
 * @description Router per la gestione degli studenti
 * @author Raika-sama
 * @date 2025-01-31 22:04:45
 */

const express = require('express');
const router = express.Router();
const { student: studentController } = require('../controllers');
const studentBulkImportController = require('../controllers/studentBulkImportController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const studentValidation = require('../middleware/studentValidation');
const { uploadExcel, handleMulterError } = require('../middleware/upload/uploadMiddleware');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');
const logger = require('../utils/errors/logger/logger');

// 1. Middleware di logging globale
router.use((req, res, next) => {
    logger.debug('Student route called:', {
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        role: req.user?.role
    });
    next();
});

// 2. Protezione globale
router.use(protect);

// 3. Route di ricerca e accesso
router.get('/search', 
    studentValidation.validateSearch,
    studentController.searchStudents
);

router.get('/my-students', 
    restrictTo('teacher', 'admin'),
    studentController.getMyStudents
);

// 4. Route di importazione bulk (solo admin)
router.get('/template', 
    restrictTo('admin'),
    studentBulkImportController.generateTemplate
);

router.post('/bulk-import', 
    restrictTo('admin'),
    uploadExcel,
    handleMulterError,
    studentBulkImportController.bulkImport.bind(studentBulkImportController)
);

// 5. Route per gestione classi
router.get('/class/:classId',
    restrictTo('teacher', 'admin'),
    studentController.getStudentsByClass
);

// 6. Route per studenti non assegnati
router.get('/unassigned-to-school',
    restrictTo('admin'),
    studentController.getUnassignedToSchoolStudents
);

router.get('/unassigned/:schoolId',
    restrictTo('admin'),
    studentController.getUnassignedStudents
);

// 7. Route per assegnazioni batch
router.post('/batch-assign',
    restrictTo('admin'),
    studentValidation.validateBatchAssignment,
    studentController.batchAssignToClass
);

router.post('/batch-assign-to-school',
    restrictTo('admin'),
    studentController.batchAssignToSchool
);

router.post('/with-class', 
    restrictTo('admin'),
    studentValidation.validateCreate, 
    studentController.createStudentWithClass
);

// 8. Route CRUD base
router.route('/')
    .get(
        restrictTo('teacher', 'admin'),
        studentController.getAll
    )
    .post(
        restrictTo('admin'),
        studentValidation.validateCreate,
        studentController.create
    );

router.route('/:id')
    .get(
        restrictTo('teacher', 'admin'),
        studentController.getById
    )
    .put(
        restrictTo('admin'),
        studentValidation.validateUpdate,
        studentController.update
    )
    .delete(
        restrictTo('admin'),
        studentController.delete
    );

// 9. Route per gestione classe singola
router.post('/:studentId/assign-class',
    restrictTo('admin'),
    studentValidation.validateClassAssignment,
    studentController.assignToClass
);

router.post('/:studentId/remove-from-class',
    restrictTo('admin'),
    studentController.removeFromClass
);

// 10. Gestione errori centralizzata
router.use((err, req, res, next) => {
    logger.error('Student route error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id
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

module.exports = router;

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