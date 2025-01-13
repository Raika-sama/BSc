/**
 * @file schoolRoutes.js
 * @description Router per la gestione delle scuole
 */

const express = require('express');
const router = express.Router();
const { school: schoolController } = require('../controllers');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Aggiungi il middleware protect a tutte le route
// Questo è già gestito in index.js, ma lo manteniamo per sicurezza
router.use(protect);

// Rotte accessibili a tutti gli utenti autenticati
router.get('/my-school', schoolController.getMySchool.bind(schoolController)); // Nuovo endpoint

router.get('/', schoolController.getAll.bind(schoolController));
router.get('/:id', schoolController.getById.bind(schoolController));
router.get('/region/:region', schoolController.getByRegion.bind(schoolController));
router.get('/type/:type', schoolController.getByType.bind(schoolController));
router.get('/:id/academic-years', schoolController.getAcademicYears.bind(schoolController));

// Rotte che richiedono privilegi di admin
router.post('/', 
    restrictTo('admin'), 
    schoolController.create.bind(schoolController)
);

router.post('/:id/setup', 
    restrictTo('admin'), 
    schoolController.setupInitialConfiguration.bind(schoolController)
);

router.post('/:id/academic-years', 
    restrictTo('admin'), 
    schoolController.setupAcademicYear.bind(schoolController)
);

router.put('/:id', 
    restrictTo('admin'), 
    schoolController.update.bind(schoolController)
);

router.delete('/:id', 
    restrictTo('admin'), 
    schoolController.delete.bind(schoolController)
);

module.exports = router;