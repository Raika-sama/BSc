// src/routes/schoolRoutes.js

/**
 * @file schoolRoutes.js
 * @description Router per la gestione delle scuole
 */

const express = require('express');
const router = express.Router();
// const { protect, restrictTo } = require('../middleware/auth'); // Da implementare
// const SchoolController = require('../controllers/schoolController'); // Da implementare

// Rotte pubbliche
router.get('/', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Lista scuole - Da implementare'
    });
});

router.get('/:id', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: `Dettagli scuola ${req.params.id} - Da implementare`
    });
});

// Rotte protette (richiederanno autenticazione)
// router.use(protect);

router.post('/', async (req, res) => {
    res.status(201).json({
        status: 'success',
        message: 'Creazione scuola - Da implementare'
    });
});

router.put('/:id', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: `Aggiornamento scuola ${req.params.id} - Da implementare`
    });
});

router.delete('/:id', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: `Eliminazione scuola ${req.params.id} - Da implementare`
    });
});

module.exports = router;