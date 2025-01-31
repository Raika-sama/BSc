/**
 * @file schoolRoutes.js
 * @description Router per la gestione delle scuole
 * @author Raika-sama
 * @date 2025-01-31
 */

const express = require('express');
const router = express.Router();
const { school: schoolController } = require('../controllers');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protezione globale per tutte le route
router.use(protect);

// 1. Rotte generali (accessibili a tutti gli utenti autenticati)
router.get('/my-school', schoolController.getMySchool.bind(schoolController));
router.get('/region/:region', schoolController.getByRegion.bind(schoolController));
router.get('/type/:type', schoolController.getByType.bind(schoolController));

// 2. Rotte di configurazione (solo admin)
router.get('/:id/academic-years', schoolController.getAcademicYears.bind(schoolController));
router.post('/:id/academic-years', 
    restrictTo('admin'),  // Usa il nuovo middleware restrictTo
    schoolController.setupAcademicYear.bind(schoolController)
);

router.post('/:id/setup', 
    restrictTo('admin'),  // Usa il nuovo middleware restrictTo
    schoolController.setupInitialConfiguration.bind(schoolController)
);

// 3. Rotte per la gestione delle sezioni
const sectionsRouter = express.Router({ mergeParams: true });
router.use('/:schoolId/sections', sectionsRouter);

// Rotte specifiche per le sezioni
sectionsRouter.get('/', schoolController.getSections.bind(schoolController));
sectionsRouter.get('/:sectionName/students', schoolController.getSectionStudents.bind(schoolController));
sectionsRouter.post('/:sectionName/deactivate', 
    restrictTo('admin'),  // Usa il nuovo middleware restrictTo
    schoolController.deactivateSection.bind(schoolController)
);
sectionsRouter.post('/:sectionName/reactivate',
    restrictTo('admin'),  // Usa il nuovo middleware restrictTo
    schoolController.reactivateSection.bind(schoolController)
);

// 4. Rotte CRUD base
router.route('/')
    .get(schoolController.getAll.bind(schoolController))
    .post(
        restrictTo('admin'),  // Usa il nuovo middleware restrictTo
        schoolController.create.bind(schoolController)
    );

router.route('/:id')
    .get(schoolController.getById.bind(schoolController))
    .put(
        restrictTo('admin'),  // Usa il nuovo middleware restrictTo
        schoolController.update.bind(schoolController)
    )
    .delete(
        restrictTo('admin'),  // Usa il nuovo middleware restrictTo
        schoolController.delete.bind(schoolController)
    );

module.exports = router;