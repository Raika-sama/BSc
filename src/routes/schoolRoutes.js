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

// Rotte protette
router.use(protect);
router.post('/', restrictTo('admin'), schoolController.create.bind(schoolController));
router.put('/:id', restrictTo('admin'), schoolController.update.bind(schoolController));
router.delete('/:id', restrictTo('admin'), schoolController.delete.bind(schoolController));

module.exports = router;