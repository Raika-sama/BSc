// src/routes/schoolRoutes.js

/**
 * @file schoolRoutes.js
 * @description Router per la gestione delle scuole
 */

const express = require('express');
const router = express.Router();
const { school: schoolController } = require('../controllers');
const { protect, restrictTo } = require('../middleware/authMiddleware');
// const { protect, restrictTo } = require('../middleware/auth'); // Da implementare
// const SchoolController = require('../controllers/schoolController'); // Da implementare

// Rotte pubbliche
router.get('/', schoolController.getAll.bind(schoolController));
router.get('/:id', schoolController.getById.bind(schoolController));
router.get('/region/:region', schoolController.getByRegion.bind(schoolController));
router.get('/type/:type', schoolController.getByType.bind(schoolController));

router.get('/', schoolController.getAll);
router.get('/:id', schoolController.getById);
router.get('/region/:region', schoolController.getByRegion);
router.get('/type/:type', schoolController.getByType);

// Middleware protect
router.use(protect);

// Rotte protette

router.post('/', restrictTo('admin'), schoolController.create.bind(schoolController));
router.put('/:id', restrictTo('admin'), schoolController.update.bind(schoolController));
router.delete('/:id', restrictTo('admin'), schoolController.delete.bind(schoolController));

// Qui le nuove rotte protette, insieme alle esistenti
router.post('/', restrictTo('admin'), schoolController.create);
router.post('/:id/setup', restrictTo('admin'), schoolController.setupInitialConfiguration);
router.post('/:id/academic-years', restrictTo('admin'), schoolController.setupAcademicYear);
router.get('/:id/academic-years', schoolController.getAcademicYears);
router.put('/:id', restrictTo('admin'), schoolController.update);
router.delete('/:id', restrictTo('admin'), schoolController.delete);


module.exports = router;