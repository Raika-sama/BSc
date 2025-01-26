const express = require('express');
const router = express.Router();
const { school: schoolController } = require('../controllers');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

// 1. Rotte generali
router.get('/my-school', schoolController.getMySchool.bind(schoolController));
router.get('/region/:region', schoolController.getByRegion.bind(schoolController));
router.get('/type/:type', schoolController.getByType.bind(schoolController));

// 2. Rotte di configurazione (prima delle rotte con parametri dinamici)
router.get('/:id/academic-years', schoolController.getAcademicYears.bind(schoolController));
router.post('/:id/academic-years', 
    restrictTo('admin'), 
    schoolController.setupAcademicYear.bind(schoolController)
);

router.post('/:id/setup', 
    restrictTo('admin'), 
    schoolController.setupInitialConfiguration.bind(schoolController)
);

// 3. Rotte per la gestione delle sezioni (raggruppate con un router dedicato)
const sectionsRouter = express.Router({ mergeParams: true });
router.use('/:schoolId/sections', sectionsRouter);

// Rotte specifiche per le sezioni
sectionsRouter.get('/', schoolController.getSections.bind(schoolController));
sectionsRouter.get('/:sectionName/students', schoolController.getSectionStudents.bind(schoolController));
sectionsRouter.post('/:sectionName/deactivate', 
    restrictTo('admin'),
    schoolController.deactivateSection.bind(schoolController)
);
sectionsRouter.post('/:sectionName/reactivate',
    restrictTo('admin'),
    schoolController.reactivateSection.bind(schoolController)
);

// 4. Rotte per la gestione della scuola
router.route('/')
    .get(schoolController.getAll.bind(schoolController))
    .post(
        restrictTo('admin'), 
        schoolController.create.bind(schoolController)
    );

router.route('/:id')
    .get(schoolController.getById.bind(schoolController))
    .put(
        restrictTo('admin'), 
        schoolController.update.bind(schoolController)
    )
    .delete(
        restrictTo('admin'), 
        schoolController.delete.bind(schoolController)
    );

module.exports = router;