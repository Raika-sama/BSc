// src/routes/testRoutes.js
const express = require('express');
const router = express.Router();
const { test: testController } = require('../controllers');
const { protect } = require('../middleware/authMiddleware');

// Applica il middleware protect a tutte le route
router.use(protect); // Non cambia perché stiamo usando lo stesso middleware

router.get('/', testController.getAll.bind(testController));
router.get('/:id', testController.getById.bind(testController));
router.get('/:testId/stats', testController.getTestStats.bind(testController));
router.post('/', testController.startTest.bind(testController));
router.post('/:testId/submit', testController.submitTest.bind(testController));

module.exports = router;