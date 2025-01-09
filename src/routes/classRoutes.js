const express = require('express');
const router = express.Router();
const { class: classController } = require('../controllers');
const logger = require('../utils/errors/logger/logger');
const { protect } = require('../middleware/authMiddleware');




// Route specifiche (devono venire PRIMA delle route generiche)
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
        next(error);
    }
});

router.get('/school/:schoolId', classController.getBySchool.bind(classController));
router.post('/transition', classController.handleYearTransition.bind(classController));

// Rotte per la gestione degli studenti
router.post('/:classId/students', classController.addStudents.bind(classController));

// Rotte base per le classi (devono venire DOPO le route specifiche)
router.route('/')
    .get(classController.getAll.bind(classController))
    .post(classController.create.bind(classController))
    .delete(classController.deleteAll.bind(classController));

router.route('/:id')
    .get(classController.getById.bind(classController))
    .put(classController.update.bind(classController))
    .delete(classController.delete.bind(classController));

// Error handling
router.use((err, req, res, next) => {
    logger.error('Class Route Error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const statusCode = err.code === 'AUTH_004' ? 401 : (err.statusCode || 500);
    res.status(statusCode).json({
        status: 'error',
        error: {
            message: err.message,
            code: err.code || 'CLASS_ROUTE_ERROR'
        }
    });
});

module.exports = router;