const express = require('express');
const router = express.Router();
const { school: schoolController } = require('../controllers');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect);

// 1. Rotte generali
router.get('/my-school', schoolController.getMySchool.bind(schoolController));
router.get('/region/:region', schoolController.getByRegion.bind(schoolController));
router.get('/type/:type', schoolController.getByType.bind(schoolController));

// 2. Rotte specifiche per le sezioni (raggruppate)
router.route('/:id/sections')
    .get(schoolController.getSections.bind(schoolController));

router.route('/:schoolId/sections/:sectionName')
    .get(schoolController.getSectionStudents.bind(schoolController))
    .post(
        restrictTo('admin'),
        schoolController.deactivateSection.bind(schoolController)
    );

router.post(
    '/:schoolId/sections/:sectionName/deactivate',
    restrictTo('admin'),
    schoolController.deactivateSection.bind(schoolController)
);

router.post(
    '/:schoolId/sections/:sectionName/reactivate',
    restrictTo('admin'),
    schoolController.reactivateSection.bind(schoolController)
);

// 3. Rotte per la gestione della scuola
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

// 4. Rotte di configurazione
router.get('/:id/academic-years', schoolController.getAcademicYears.bind(schoolController));
router.post('/:id/academic-years', 
    restrictTo('admin'), 
    schoolController.setupAcademicYear.bind(schoolController)
);

router.post('/:id/setup', 
    restrictTo('admin'), 
    schoolController.setupInitialConfiguration.bind(schoolController)
);

module.exports = router;