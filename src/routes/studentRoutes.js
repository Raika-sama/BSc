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
// const { protect, restrictTo } = require('../middleware/auth'); // TODO: Implementare

// Middleware di logging specifico per student routes
router.use((req, res, next) => {
    logger.info(`Student Route Called: ${req.method} ${req.originalUrl}`);
    next();
});

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

// Error handling specifico per student routes
router.use((err, req, res, next) => {
    logger.error('Student Route Error:', err);
    res.status(err.statusCode || 500).json({
        status: 'error',
        error: {
            message: err.message,
            code: err.code || 'STUDENT_ROUTE_ERROR'
        }
    });
});

module.exports = router;