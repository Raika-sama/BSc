// src/routes/testRoutes.js

/**
 * @file testRoutes.js
 * @description Router per la gestione dei test
 */

const express = require('express');
const router = express.Router();
const { test: testController } = require('../controllers');

// Rotte protette per i test
// router.use(protect);

router.get('/', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Lista test - Da implementare'
    });
});

router.post('/', async (req, res) => {
    res.status(201).json({
        status: 'success',
        message: 'Creazione test - Da implementare'
    });
});

router.get('/:id/results', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: `Risultati test ${req.params.id} - Da implementare`
    });
});

router.post('/:id/submit', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: `Invio risultati test ${req.params.id} - Da implementare`
    });
});


// router.use(protect); // Tutte le rotte dei test sono protette
router.get('/', testController.getAll.bind(testController));
router.get('/:id', testController.getById.bind(testController));
router.get('/:testId/stats', testController.getTestStats.bind(testController));
router.post('/', testController.startTest.bind(testController));
router.post('/:testId/submit', testController.submitTest.bind(testController));


module.exports = router;