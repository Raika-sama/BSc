// src/routes/studentRoutes.js

/**
 * @file studentRoutes.js
 * @description Router per la gestione degli studenti
 * @author Raika-sama
 * @date 2025-01-05
 */

const express = require('express');
const router = express.Router();
const { student: studentController } = require('../controllers');
const logger = require('../utils/errors/logger/logger');  // Aggiunto import del logger
// const { protect, restrictTo } = require('../middleware/auth'); // TODO: Implementare

// Middleware di logging specifico per student routes
router.use((req, res, next) => {
    logger.info(`Student Route Called: ${req.method} ${req.originalUrl}`);
    next();
});

// IMPORTANTE: Rotte specifiche PRIMA delle rotte parametriche
router.get('/search', studentController.searchByName.bind(studentController));


// Rotte pubbliche (saranno protette in seguito)
router.get('/', studentController.getAll.bind(studentController));
router.get('/:id', studentController.getById.bind(studentController));

// Rotte specifiche per gli studenti
router.get('/:studentId/tests', studentController.getStudentTests.bind(studentController));
router.get('/:studentId/results', studentController.getTestResults.bind(studentController));

// Rotte protette (richiederanno autenticazione)
// router.use(protect);
router.post('/', studentController.create.bind(studentController));
router.put('/:id', studentController.update.bind(studentController));
router.delete('/:id', studentController.delete.bind(studentController));

// Dopo le altre rotte ma prima del middleware di errore
router.put('/:id/assign-class', studentController.assignToClass.bind(studentController));

// Error handling specifico per student routes
router.use((err, req, res, next) => {
    logger.error('Student Route Error:', { 
        message: err.message,
        stack: err.stack,
        code: err.code
    });
    
    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            message: err.message,
            code: err.code || 'STUDENT_ROUTE_ERROR',
            status: err.statusCode || 500,
            metadata: err.metadata || {}
        }
    });
});

module.exports = router;