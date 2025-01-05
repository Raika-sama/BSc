// src/routes/userRoutes.js

/**
 * @file userRoutes.js
 * @description Router per la gestione degli utenti
 */

const express = require('express');
const router = express.Router();
const { user: userController } = require('../controllers');

// Rotte di autenticazione (pubbliche)
router.post('/login', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Login - Da implementare'
    });
});

router.post('/register', async (req, res) => {
    res.status(201).json({
        status: 'success',
        message: 'Registrazione - Da implementare'
    });
});

router.post('/forgot-password', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Reset password - Da implementare'
    });
});

// Rotte protette

// Rotte pubbliche
router.post('/login', userController.login.bind(userController));
router.post('/register', userController.register.bind(userController));
router.post('/forgot-password', userController.forgotPassword.bind(userController));

// Rotte protette
// router.use(protect);
router.get('/me', userController.getById.bind(userController));
router.put('/me', userController.update.bind(userController));


// router.use(protect);

router.get('/me', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Profilo utente - Da implementare'
    });
});

router.put('/update-password', async (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Aggiornamento password - Da implementare'
    });
});

module.exports = router;