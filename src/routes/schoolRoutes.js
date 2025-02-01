// src/routes/schoolRoutes.js
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const logger = require('../utils/errors/logger/logger');

const createSchoolRouter = ({ schoolController }) => {
    const router = express.Router();

    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

    // Protezione globale per tutte le route
    router.use(protect);

    // 1. Rotte generali
    router.get('/my-school', asyncHandler(schoolController.getMySchool.bind(schoolController)));
    router.get('/region/:region', asyncHandler(schoolController.getByRegion.bind(schoolController)));
    router.get('/type/:type', asyncHandler(schoolController.getByType.bind(schoolController)));

    // 2. Rotte di configurazione (solo admin)
    router.get('/:id/academic-years', asyncHandler(schoolController.getAcademicYears.bind(schoolController)));
    router.post('/:id/academic-years', 
        restrictTo('admin'),
        asyncHandler(schoolController.setupAcademicYear.bind(schoolController))
    );

    router.post('/:id/setup', 
        restrictTo('admin'),
        asyncHandler(schoolController.setupInitialConfiguration.bind(schoolController))
    );

    // 3. Rotte per la gestione delle sezioni
    const sectionsRouter = express.Router({ mergeParams: true });
    router.use('/:schoolId/sections', sectionsRouter);

    sectionsRouter.get('/', asyncHandler(schoolController.getSections.bind(schoolController)));
    sectionsRouter.get('/:sectionName/students', asyncHandler(schoolController.getSectionStudents.bind(schoolController)));
    sectionsRouter.post('/:sectionName/deactivate', 
        restrictTo('admin'),
        asyncHandler(schoolController.deactivateSection.bind(schoolController))
    );
    sectionsRouter.post('/:sectionName/reactivate',
        restrictTo('admin'),
        asyncHandler(schoolController.reactivateSection.bind(schoolController))
    );

    // 4. Rotte CRUD base
    router.route('/')
        .get(asyncHandler(schoolController.getAll.bind(schoolController)))
        .post(
            restrictTo('admin'),
            asyncHandler(schoolController.create.bind(schoolController))
        );

    router.route('/:id')
        .get(asyncHandler(schoolController.getById.bind(schoolController)))
        .put(
            restrictTo('admin'),
            asyncHandler(schoolController.update.bind(schoolController))
        )
        .delete(
            restrictTo('admin'),
            asyncHandler(schoolController.delete.bind(schoolController))
        );

    return router;
};

module.exports = createSchoolRouter;