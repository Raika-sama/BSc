const express = require('express');
const router = express.Router();
const { student: studentController } = require('../controllers');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const studentValidation = require('../middleware/studentValidation');
const logger = require('../utils/errors/logger/logger');
const { ErrorTypes, createError } = require('../utils/errors/errorTypes');  // Aggiusta il percorso in base alla tua struttura

// Middleware di logging
router.use((req, res, next) => {
    logger.debug('Student route called:', {
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        role: req.user?.role
    });
    next();
});

// Protezione route
router.use(protect);

// Route di ricerca (con validazione)
router.get('/search', 
    studentValidation.validateSearch,
    studentController.searchStudents
);

// Route per docenti
router.get('/my-students', 
    restrictTo('teacher', 'admin'),
    studentController.getMyStudents
);

// Route per classe specifica
router.get('/class/:classId',
    restrictTo('teacher', 'admin'),
    studentController.getStudentsByClass
);

// Nuove route per gestione studenti non assegnati
    router.get('/unassigned/:schoolId',
        restrictTo('admin'),
        studentController.getUnassignedStudents
        );

    router.post('/batch-assign',
        restrictTo('admin'),
    studentValidation.validateBatchAssignment,
    studentController.batchAssignToClass
    );

// Route base CRUD con validazioni
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

// Route per gestione classe con validazioni
router.post('/:studentId/assign-class',
    restrictTo('admin'),
    studentValidation.validateClassAssignment,
    studentController.assignToClass
);

router.post('/:studentId/remove-from-class',
    restrictTo('admin'),
    studentController.removeFromClass
);

// Gestione errori
router.use((err, req, res, next) => {
    logger.error('Student route error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id
    });

    // Gestione errori di validazione
    if (err.code === ErrorTypes.VALIDATION.BAD_REQUEST.code) {
        return res.status(400).json({
            status: 'error',
            error: {
                code: err.code,
                message: err.message,
                details: err.metadata?.details
            }
        });
    }

    // Altri errori
    const statusCode = err.statusCode || 500;

    // Controlla se err ha la proprietà code
    if (!err.code) {
        // Se err.code non esiste, usa l'errore generico
        err = createError(ErrorTypes.SYSTEM.GENERIC_ERROR, 'Errore sconosciuto');
    }

    res.status(statusCode).json({
        status: 'error',
        error: {
            code: err.code, 
            message: err.message 
        }
    });
});

module.exports = router;

/* 
Riepilogo Routes:

GET    /api/v1/students                    - Lista studenti (teacher/admin)
POST   /api/v1/students                    - Crea studente (admin)
GET    /api/v1/students/:id                - Dettaglio studente (teacher/admin)
PUT    /api/v1/students/:id                - Modifica studente (admin)
DELETE /api/v1/students/:id                - Elimina studente (admin)
GET    /api/v1/students/search             - Ricerca studenti (teacher/admin)
GET    /api/v1/students/my-students        - Studenti del docente (teacher/admin)
GET    /api/v1/students/class/:id          - Studenti per classe (teacher/admin)
POST   /api/v1/students/:id/assign-class   - Assegna a classe (admin)
POST   /api/v1/students/:id/remove-from-class - Rimuove da classe (admin)
GET    /api/v1/students/unassigned/:schoolId - Lista studenti non assegnati (admin) [NUOVO]
POST   /api/v1/students/batch-assign       - Assegnazione multipla a classe (admin) [NUOVO]

Controllo Accessi:
- Admin: accesso completo
- Teacher: solo lettura e propri studenti
- Altri: nessun accesso
*/