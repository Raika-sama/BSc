// src/routes/classRoutes.js

/**
 * @file classRoutes.js
 * @description Router per la gestione delle classi
 * @author Raika-sama
 * @date 2025-01-05
 */

const express = require('express');
const router = express.Router();
const { class: classController } = require('../controllers');
const logger = require('../utils/errors/logger/logger');
// const { protect, restrictTo } = require('../middleware/auth'); // TODO: Implementare

// Middleware di logging specifico per class routes
router.use((req, res, next) => {
    logger.info(`Class Route Called: ${req.method} ${req.originalUrl}`);
    next();
});


// Rotte base per le classi
router.get('/', classController.getAll.bind(classController));
router.get('/:id', classController.getById.bind(classController));

// Rotte specifiche per le classi
router.get('/school/:schoolId', classController.getBySchool.bind(classController));

// Rotte protette (richiederanno autenticazione)
// router.use(protect);
router.post('/', classController.create.bind(classController));
router.put('/:id', classController.update.bind(classController));
router.delete('/:id', classController.delete.bind(classController));
router.delete('/', classController.deleteAll.bind(classController));


// Rotte per la gestione degli studenti nella classe
router.post('/:classId/students', classController.addStudents.bind(classController));
// TODO: Implementare rimozione studenti
// router.delete('/:classId/students/:studentId', classController.removeStudent.bind(classController));

// Error handling specifico per class routes
router.use((err, req, res, next) => {
    logger.error('Class Route Error:', err);
    res.status(err.statusCode || 500).json({
        status: 'error',
        error: {
            message: err.message,
            code: err.code || 'CLASS_ROUTE_ERROR'
        }
    });
});

module.exports = router;